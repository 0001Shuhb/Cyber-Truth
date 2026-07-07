# app/extensions.py
"""
Extensions module.

This module creates Flask extension instances WITHOUT binding them
to a specific Flask app. The actual binding happens in the app factory
(app/__init__.py) using the init_app() pattern.

WHY THIS PATTERN?
If you did `db = SQLAlchemy(app)` directly, you'd need the Flask app
object to exist when this file is imported. That creates circular imports
(models import db, db needs app, app imports models...).

The init_app() pattern breaks this cycle: extensions are created here
with no app reference, and configured later when the app exists.

This also enables TESTING — you can create a test app with a different
database and bind the same db extension to it.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# SQLAlchemy ORM instance
# All models will inherit from db.Model
db = SQLAlchemy()

# JWT manager handles access and refresh tokens
# Configured via JWT_* variables in config
jwt = JWTManager()

# Bcrypt for password hashing
# Automatically determines salt rounds based on cost factor
bcrypt = Bcrypt()

# CORS allows the React frontend (different origin/port) to call our API
# Without this, browsers block cross-origin requests
cors = CORS()

# Rate limiter uses Redis as backend storage
# get_remote_address extracts the client IP from the request
# This is what stops someone from hammering your API
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],  # No default limit; apply per-route
    storage_uri="memory://",  # Will be overridden by config
)