# app/routes/auth.py
"""
Authentication endpoints.

/api/auth/register  — Create a new account
/api/auth/login     — Authenticate and get tokens
/api/auth/logout    — Revoke refresh token
/api/auth/refresh   — Get new access token using refresh token
/api/auth/me        — Get current user's profile

SECURITY PHILOSOPHY FOR AUTH:
1. Never return different errors for "email not found" vs "wrong password".
   If you do, an attacker can enumerate which emails have accounts.
   Always return generic "Invalid credentials" for failed logins.

2. Use short-lived access tokens (15 min) + long-lived refresh tokens (30 days).
   Access tokens are in memory (XSS-resistant), refresh tokens in httpOnly cookies.

3. Rate-limit login attempts aggressively.
   5 attempts per minute per IP is reasonable.

4. Log all auth events (success and failure) for intrusion detection.

5. Constant-time password comparison (bcrypt handles this) prevents
   timing attacks.
"""

from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from marshmallow import ValidationError

from ..extensions import db, limiter
from ..models.user import User
from ..utils.response import success_response, error_response, validation_error_response
from ..utils.validators import RegisterSchema, LoginSchema
from ..utils.security import sanitize_string

# Create the auth blueprint
# All routes in this file will have the /api/auth prefix
auth_bp = Blueprint('auth', __name__)

# Schema instances — created once, reused for every request
register_schema = RegisterSchema()
login_schema    = LoginSchema()


@auth_bp.route('/register', methods=['POST'])
@limiter.limit('10 per hour')  # Max 10 registration attempts per IP per hour
def register():
    """
    POST /api/auth/register

    Create a new PhishGuard account.

    Request body:
        email    (str, required) — valid email address
        username (str, required) — 3-30 chars, letters/numbers/_/-
        password (str, required) — min 8 chars, complexity enforced

    Returns:
        201: Account created, access token in body, refresh token in cookie
        422: Validation error
        409: Email or username already exists
    """
    # ==================================================
    # 1. Parse and Validate Request Body
    # ==================================================
    try:
        # request.get_json() returns None if Content-Type isn't application/json
        # or if the body isn't valid JSON
        data = request.get_json(silent=True)

        if not data:
            return error_response(
                'INVALID_JSON',
                'Request body must be valid JSON with Content-Type: application/json',
                status_code=400
            )

        # Marshmallow validates types, required fields, length, email format,
        # and our custom password strength validator.
        # If validation fails, ValidationError is raised with a dict of errors.
        validated = register_schema.load(data)

    except ValidationError as e:
        # e.messages is a dict: {'field_name': ['error1', 'error2'], ...}
        return validation_error_response(e.messages)

    # ==================================================
    # 2. Sanitize Inputs
    # ==================================================
    email    = sanitize_string(validated['email']).lower()  # Normalize email to lowercase
    username = sanitize_string(validated['username'])
    password = validated['password']  # Don't sanitize password — special chars are intentional

    # ==================================================
    # 3. Check for Duplicate Accounts
    # ==================================================
    # WHY CHECK BOTH?
    # Email and username are both unique identifiers.
    # We need to tell the user WHICH one is taken.
    # Note: in extremely security-sensitive systems, you might NOT
    # tell users which field is taken (to prevent account enumeration).
    # For a portfolio project, clear error messages are fine.

    existing_email = User.query.filter(
        db.func.lower(User.email) == email
    ).first()

    if existing_email:
        return error_response(
            'EMAIL_TAKEN',
            'An account with this email address already exists.',
            status_code=409  # 409 Conflict
        )

    existing_username = User.query.filter(
        db.func.lower(User.username) == username.lower()
    ).first()

    if existing_username:
        return error_response(
            'USERNAME_TAKEN',
            'This username is already taken. Please choose another.',
            status_code=409
        )

    # ==================================================
    # 4. Create the User
    # ==================================================
    try:
        new_user = User(email=email, username=username)
        new_user.set_password(password)  # bcrypt hashing happens here

        db.session.add(new_user)
        db.session.commit()

    except Exception as e:
        db.session.rollback()  # Always rollback on failure
        return error_response(
            'DATABASE_ERROR',
            'Failed to create account. Please try again.',
            status_code=500
        )

    # ==================================================
    # 5. Generate JWT Tokens
    # ==================================================
    # identity: the value stored in the JWT payload as 'sub' (subject)
    # We use the user's UUID as the identity — never the email (it can change)
    access_token  = create_access_token(identity=new_user.id)
    refresh_token = create_refresh_token(identity=new_user.id)

    # ==================================================
    # 6. Return Response
    # ==================================================
    response = success_response(
        data={
            'user':         new_user.to_dict(include_private=True),
            'access_token': access_token,
        },
        message='Account created successfully. Welcome to Cyber Truth!',
        status_code=201
    )

    # Set the refresh token as an httpOnly cookie.
    # httpOnly means JavaScript CANNOT read this cookie.
    # Even if your React app has an XSS vulnerability, the refresh token
    # is safe because no script can access httpOnly cookies.
    set_refresh_cookies(response[0], refresh_token)

    return response


@auth_bp.route('/login', methods=['POST'])
@limiter.limit('5 per minute; 20 per hour')  # Aggressive rate limiting for login
def login():
    """
    POST /api/auth/login

    Authenticate with email and password.

    SECURITY: We never reveal whether the email exists or the password
    is wrong — only "Invalid credentials" for all failures.
    This prevents email enumeration attacks.

    Returns:
        200: Success with access token + user data, refresh token in cookie
        401: Invalid credentials (intentionally vague)
        429: Too many attempts
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('INVALID_JSON', 'Request body must be valid JSON', status_code=400)
        validated = login_schema.load(data)
    except ValidationError as e:
        return validation_error_response(e.messages)

    email    = sanitize_string(validated['email']).lower()
    password = validated['password']

    # ==================================================
    # Find User + Verify Password
    # ==================================================
    user = User.query.filter(db.func.lower(User.email) == email).first()

    # CRITICAL SECURITY PATTERN: Always call check_password() even if user doesn't exist.
    # If you return early when user is None, the response time is faster for
    # non-existent emails, revealing which emails have accounts.
    # By running bcrypt regardless, timing is consistent.

    if user is None:
        # Perform a dummy bcrypt check to consume the same time as a real check
        # This makes it impossible to distinguish "email not found" from "wrong password"
        # by measuring response time.
        import bcrypt as _bcrypt
        _bcrypt.checkpw(b'dummy_password', b'$2b$12$invalid.hash.padding.to.match.length.xxxxxx')
        return error_response('INVALID_CREDENTIALS', 'Invalid email or password.', status_code=401)

    if not user.check_password(password):
        return error_response('INVALID_CREDENTIALS', 'Invalid email or password.', status_code=401)

    if not user.is_active:
        return error_response(
            'ACCOUNT_SUSPENDED',
            'Your account has been suspended. Contact support.',
            status_code=403
        )

    # ==================================================
    # Issue Tokens + Update Login Record
    # ==================================================
    access_token  = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}  # Embed role in token for fast RBAC checks
    )
    refresh_token = create_refresh_token(identity=user.id)

    user.update_last_login()  # Record login timestamp

    response = success_response(
        data={
            'user':         user.to_dict(include_private=True),
            'access_token': access_token,
        },
        message='Login successful.'
    )

    set_refresh_cookies(response[0], refresh_token)
    return response


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)  # This endpoint requires the REFRESH token (from cookie)
@limiter.limit('30 per hour')
def refresh():
    """
    POST /api/auth/refresh

    Exchange a valid refresh token for a new access token.
    The refresh token comes automatically from the httpOnly cookie.

    This is called "silent refresh" — the user never sees it.
    The React frontend's Axios interceptor calls this automatically
    when any request returns 401.
    """
    user_id = get_jwt_identity()

    # Verify the user still exists and is active
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return error_response('UNAUTHORIZED', 'User account not found or suspended.', status_code=401)

    new_access_token = create_access_token(
        identity=user_id,
        additional_claims={'role': user.role}
    )

    return success_response(
        data={'access_token': new_access_token},
        message='Token refreshed.'
    )


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    POST /api/auth/logout

    Revoke the refresh token cookie and clear the session.

    NOTE: We don't maintain a token blacklist in this version.
    The access token remains valid until it naturally expires (15 min).
    For full invalidation, you'd add the JWT ID (jti) to a Redis blacklist
    and check it in a jwt.token_in_blocklist_loader callback.
    """
    response = success_response(data=None, message='Logged out successfully.')
    unset_jwt_cookies(response[0])  # Clears the refresh token cookie
    return response


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    GET /api/auth/me

    Returns the profile of the currently authenticated user.
    Requires a valid access token in the Authorization header.
    """
    user_id = get_jwt_identity()  # Extracts the 'sub' claim from the JWT
    user = User.query.get(user_id)

    if not user:
        return error_response('USER_NOT_FOUND', 'User account not found.', status_code=404)

    # Include scan statistics
    stats = {
        'total_scans':     user.scans.count(),
        'recent_scans':    user.scans.order_by('created_at desc').limit(5).count(),
    }

    return success_response(
        data={
            'user':  user.to_dict(include_private=True),
            'stats': stats,
        }
    )