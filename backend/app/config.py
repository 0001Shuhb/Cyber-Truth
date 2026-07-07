# app/config.py
"""
Configuration module using class-based config.

We define three classes:
  - BaseConfig: shared settings
  - DevelopmentConfig: local dev (debug on, SQLite)
  - ProductionConfig: deployed app (debug off, PostgreSQL, strict security)
  - TestingConfig: unit tests (in-memory SQLite, no rate limits)

The factory function at the bottom selects the right class
based on the FLASK_ENV environment variable.

WHY CLASS-BASED CONFIG?
It gives you inheritance. ProductionConfig can inherit everything
from BaseConfig and only override what changes. Much cleaner than
a flat dictionary or checking environment variables everywhere.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file into environment variables
# This must happen before we read os.environ
load_dotenv()


class BaseConfig:
    """Settings shared across all environments."""

    # ==================================================
    # Flask Core
    # ==================================================
    # SECRET_KEY signs Flask session cookies.
    # If this leaks, attackers can forge sessions.
    # In production, generate with: python -c "import secrets; print(secrets.token_hex(64))"
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')

    # Disable JSON key sorting — preserves insertion order in responses
    JSON_SORT_KEYS = False

    # ==================================================
    # Database (SQLAlchemy)
    # ==================================================
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///phishguard.db')

    # Disable modification tracking — reduces memory overhead
    # SQLAlchemy will warn you about changes anyway
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Connection pool settings for PostgreSQL in production
    # (SQLite ignores these, but keep them for the migration)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,       # Test connections before using (detects stale connections)
        'pool_recycle': 300,         # Recycle connections after 5 minutes
        'pool_size': 10,             # Number of connections to maintain in the pool
        'max_overflow': 20,          # Allow up to 20 extra connections during spikes
    }

    # ==================================================
    # JWT Configuration
    # ==================================================
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')

    # Access token: short-lived. If stolen, attacker access is limited to 15 minutes.
    # This is the "blast radius" minimization principle.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 15))
    )

    # Refresh token: long-lived, stored in httpOnly cookie.
    # Used to silently get new access tokens without re-login.
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 30))
    )

    # Token location: look for JWT in Authorization header AND cookies
    # Authorization: Bearer <token>  (for API clients)
    # Cookie: refresh_token_cookie   (for web browser refresh)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']

    # Cookie security settings
    JWT_COOKIE_SECURE = False       # Set True in production (requires HTTPS)
    JWT_COOKIE_SAMESITE = 'Lax'     # Prevents CSRF. 'Strict' for max security.
    JWT_COOKIE_CSRF_PROTECT = True  # Enable CSRF protection for cookie tokens
    JWT_ACCESS_COOKIE_NAME = 'access_token_cookie'
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'

    # ==================================================
    # CORS (Cross-Origin Resource Sharing)
    # ==================================================
    # Only allow requests from our React frontend.
    # Wildcard (*) in production is a security risk — be explicit.
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')

    # Allow cookies to be sent with cross-origin requests (needed for refresh token cookie)
    CORS_SUPPORTS_CREDENTIALS = True

    # Which headers the browser is allowed to send
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization', 'X-CSRF-TOKEN']

    # ==================================================
    # Rate Limiting
    # ==================================================
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL', 'memory://')

    # Strategy: fixed-window vs moving-window
    # moving-window is more accurate but uses more Redis memory
    RATELIMIT_STRATEGY = 'fixed-window'

    # Include rate limit headers in responses so clients know their limit status
    # X-RateLimit-Limit: 100
    # X-RateLimit-Remaining: 47
    # X-RateLimit-Reset: 1705123456
    RATELIMIT_HEADERS_ENABLED = True

    # ==================================================
    # Application Settings
    # ==================================================
    MAX_SCAN_URL_LENGTH = int(os.environ.get('MAX_SCAN_URL_LENGTH', 2048))

    # Threat Intelligence API Keys
    VIRUSTOTAL_API_KEY  = os.environ.get('VIRUSTOTAL_API_KEY', '')
    ABUSEIPDB_API_KEY   = os.environ.get('ABUSEIPDB_API_KEY', '')
    ALIENVAULT_OTX_KEY  = os.environ.get('ALIENVAULT_OTX_KEY', '')

    # Celery settings (background task queue)
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_TASK_ALWAYS_EAGER = False

    # ==================================================
    # Security Headers (set manually in after_request)
    # ==================================================
    SECURITY_HEADERS = {
        # Prevent MIME type sniffing — browser must use declared Content-Type
        'X-Content-Type-Options': 'nosniff',

        # Prevent clickjacking — don't allow embedding in iframes
        'X-Frame-Options': 'DENY',

        # Disable browser's built-in XSS filter reflection (use CSP instead)
        'X-XSS-Protection': '1; mode=block',

        # Strict referrer policy — don't leak URL in Referer header
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        # Content Security Policy — whitelist what can be loaded
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    }


class DevelopmentConfig(BaseConfig):
    """Development environment — verbose, permissive, SQLite."""

    DEBUG = True

    # In development, we want to see SQL queries in the terminal
    SQLALCHEMY_ECHO = True

    # Longer token expiry in dev so you don't have to re-login every 15 minutes
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # Relax rate limits in development so you can test freely
    RATELIMIT_ENABLED = False

    # Run Celery tasks eagerly in development (no external broker required)
    CELERY_TASK_ALWAYS_EAGER = True


class ProductionConfig(BaseConfig):
    """Production environment — strict, PostgreSQL, Redis required."""

    DEBUG = False
    TESTING = False

    # Require HTTPS for cookie security in production
    JWT_COOKIE_SECURE = True

    # Strict CSRF protection
    JWT_COOKIE_SAMESITE = 'Strict'

    # Require Redis for production rate limiting (memory:// doesn't persist across workers)
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL')  # Will crash if not set — intentional

    # Don't echo SQL in production logs (performance + security)
    SQLALCHEMY_ECHO = False

    # Strict CORS — only allow the deployed frontend
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')


class TestingConfig(BaseConfig):
    """Test environment — in-memory DB, no rate limits, no external calls."""

    TESTING = True
    DEBUG = True

    # Use in-memory SQLite — no files left behind after tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    # Don't check CSRF tokens in tests
    WTF_CSRF_ENABLED = False

    # Disable rate limiting so tests can call endpoints freely
    RATELIMIT_ENABLED = False

    # Short token expiry so we can test token refresh flows
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=10)


# Factory: map string names to config classes
# Usage: app.config.from_object(get_config('development'))
_config_map = {
    'development': DevelopmentConfig,
    'production':  ProductionConfig,
    'testing':     TestingConfig,
    'default':     DevelopmentConfig,
}

def get_config(env: str = None) -> type:
    """Return the config class for the given environment string."""
    env = env or os.environ.get('FLASK_ENV', 'development')
    return _config_map.get(env, DevelopmentConfig)