# app/__init__.py
"""
Flask Application Factory.

The factory pattern (create_app()) instead of a global app object has
several key advantages:

1. TESTABILITY: Tests can call create_app('testing') to get a configured
   test instance without affecting the real app.

2. MULTIPLE INSTANCES: You can run multiple Flask apps in one process
   with different configs (e.g., main app + admin app).

3. NO CIRCULAR IMPORTS: Extensions are created in extensions.py without
   an app reference. The factory wires everything together.

4. EXPLICIT CONFIGURATION: The config is explicitly passed in, not
   inferred from a global. Easier to reason about.

HOW IT WORKS:
1. create_app() is called with an environment string
2. Flask app object is created
3. Config is loaded onto the app
4. Each extension's init_app(app) binds it to this specific app
5. Database models are imported (registering them with SQLAlchemy)
6. Route blueprints are registered
7. Error handlers and hooks are set up
8. The configured app is returned
"""

from flask import Flask, jsonify
from .config import get_config
from .extensions import db, jwt, bcrypt, cors, limiter
from .utils.security import apply_security_headers
from .utils.response import error_response


def create_app(env: str = None) -> Flask:
    """
    Create and configure the Flask application.

    Args:
        env: Environment name ('development', 'production', 'testing')
             Defaults to FLASK_ENV environment variable, then 'development'

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)

    # ==================================================
    # 1. Load Configuration
    # ==================================================
    config_class = get_config(env)
    app.config.from_object(config_class)

    # ==================================================
    # 2. Initialize Extensions
    # ==================================================
    # Each init_app() call binds the extension to this specific app.
    # After this, you can use db.session, jwt decorators, etc.
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    limiter.init_app(app)

    # CORS needs explicit configuration beyond init_app
    cors.init_app(
        app,
        resources={r'/api/*': {            # Only CORS-enable the API endpoints
            'origins':           app.config['CORS_ORIGINS'],
            'supports_credentials': True,  # Allow cookies (needed for refresh token)
            'allow_headers':    ['Content-Type', 'Authorization', 'X-CSRF-TOKEN'],
            'methods':          ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'expose_headers':   ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        }}
    )

    # ==================================================
    # 3. Register Models (MUST happen before create_all)
    # ==================================================
    # Importing models registers them with SQLAlchemy's metadata.
    # Without this import, db.create_all() wouldn't know about the tables.
    from .models import user, scan, report  # noqa: F401

    # ==================================================
    # 4. Create Database Tables
    # ==================================================
    with app.app_context():
        # create_all() is idempotent — it only creates tables that don't exist.
        # In production, use Alembic migrations instead (handles schema changes).
        db.create_all()

    # ==================================================
    # 5. Register Route Blueprints
    # ==================================================
    # Blueprints group related routes. Each blueprint has its own URL prefix.
    # Benefits: organized code, no naming conflicts, reusable across apps.
    from .routes.auth   import auth_bp
    from .routes.scan   import scan_bp
    from .routes.report import report_bp
    from .routes.admin  import admin_bp
    from .routes.intel  import intel_bp

    app.register_blueprint(auth_bp,   url_prefix='/api/auth')
    app.register_blueprint(scan_bp,   url_prefix='/api/scan')
    app.register_blueprint(report_bp, url_prefix='/api/report')
    app.register_blueprint(admin_bp,  url_prefix='/api/admin')
    app.register_blueprint(intel_bp,   url_prefix='/api/intel')

    # ==================================================
    # 6. JWT Error Handlers
    # ==================================================
    # Flask-JWT-Extended fires these when JWT validation fails.
    # Without custom handlers, it returns HTML error pages.
    # We return consistent JSON instead.

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Called when a JWT access token has expired."""
        return error_response(
            'TOKEN_EXPIRED',
            'Your session has expired. Please log in again.',
            status_code=401
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        """Called when a JWT token is malformed or has an invalid signature."""
        return error_response(
            'INVALID_TOKEN',
            'Token is invalid. Please log in again.',
            status_code=401
        )

    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        """Called when no JWT token is provided to a protected endpoint."""
        return error_response(
            'UNAUTHORIZED',
            'Authentication required. Please log in.',
            status_code=401
        )

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Called when a token has been explicitly revoked (logout)."""
        return error_response(
            'TOKEN_REVOKED',
            'Token has been revoked. Please log in again.',
            status_code=401
        )

    # ==================================================
    # 7. Rate Limiter Error Handler
    # ==================================================

    @app.errorhandler(429)
    def ratelimit_handler(e):
        """Called when a request exceeds the rate limit."""
        return error_response(
            'RATE_LIMIT_EXCEEDED',
            f'Too many requests. Limit: {e.description}',
            status_code=429
        )

    # ==================================================
    # 8. General Error Handlers
    # ==================================================

    @app.errorhandler(404)
    def not_found(e):
        return error_response('NOT_FOUND', 'The requested resource does not exist.', status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response('METHOD_NOT_ALLOWED', 'HTTP method not allowed on this endpoint.', status_code=405)

    @app.errorhandler(500)
    def internal_error(e):
        # Log the real error internally, return generic message externally.
        # NEVER expose stack traces to API consumers — they contain
        # file paths, library versions, and internal logic.
        app.logger.error(f'Internal server error: {e}')
        return error_response('INTERNAL_ERROR', 'An internal server error occurred.', status_code=500)

    # ==================================================
    # 9. Request/Response Hooks
    # ==================================================

    @app.after_request
    def add_security_headers(response):
        """
        Apply security headers to every response.

        after_request runs after every successful route handler.
        Centralizing headers here means no route can accidentally omit them.
        """
        return apply_security_headers(response)

    @app.before_request
    def log_request_info():
        """Log incoming requests for audit trails (development only)."""
        if app.debug:
            from flask import request
            app.logger.debug(
                f'{request.method} {request.path} — '
                f'IP: {request.remote_addr}'
            )

    # ==================================================
    # 10. Health Check Endpoint
    # ==================================================
    # Simple endpoint for load balancer health checks.
    # No auth required — just confirms the app is running.

    @app.route('/health')
    def health_check():
        return jsonify({
            'status':  'healthy',
            'version': '1.0.0',
            'service': 'Cyber Truth API',
        })

    # --------------------------------------------------
    # Initialize Celery and register background tasks
    # --------------------------------------------------
    try:
        from .celery_app import make_celery
        from .tasks import register_celery_tasks

        celery = make_celery(app)
        register_celery_tasks(celery)
        # Attach for easy access from routes/tests
        app.celery = celery
    except Exception as e:
        # If Celery not available or registration fails, log and continue.
        app.logger.debug(f'Celery not initialized: {e}')

    return app