# app/utils/validators.py
"""
Request body validation schemas using marshmallow.

Marshmallow lets you define what a valid request body looks like.
If the request doesn't match the schema, it's rejected at the schema
level — before any route code runs. This is defense in depth.

Benefits:
1. Type coercion (string "42" → integer 42)
2. Required field enforcement
3. Format validation (email format, URL format)
4. Length limits
5. Custom validators (password strength, etc.)
6. Clear error messages for API consumers
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class RegisterSchema(Schema):
    """Validates the POST /api/auth/register request body."""

    email = fields.Email(
        required=True,
        error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'}
    )

    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=30, error='Username must be 3-30 characters'),
            # Only letters, numbers, underscores, hyphens
            validate.Regexp(
                r'^[a-zA-Z0-9_-]+$',
                error='Username can only contain letters, numbers, underscores and hyphens'
            )
        ]
    )

    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, error='Password must be at least 8 characters'),
        load_only=True  # Never include password in serialized output
    )

    @validates('password')
    def validate_password_strength(self, value, **kwargs):
        """
        Enforce password complexity requirements.

        A password is strong if it has:
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character

        WHY THESE RULES?
        Each requirement adds an order of magnitude to the brute-force
        search space. 8-char lowercase-only: 26^8 ≈ 200 billion combinations.
        Add uppercase+digits+special: ~95^8 ≈ 6.6 quadrillion combinations.
        """
        errors = []
        if not re.search(r'[A-Z]', value):
            errors.append('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            errors.append('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            errors.append('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', value):
            errors.append('Password must contain at least one special character')
        if errors:
            raise ValidationError(errors)


class LoginSchema(Schema):
    """Validates the POST /api/auth/login request body."""
    email    = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class URLScanSchema(Schema):
    """Validates URL scan requests."""
    url = fields.Str(
        required=True,
        validate=[
            validate.Length(min=4, max=2048, error='URL must be 4-2048 characters'),
        ]
    )

    @validates('url')
    def validate_url_format(self, value, **kwargs):
        """Ensure the URL starts with http:// or https://."""
        if not value.startswith(('http://', 'https://')):
            raise ValidationError(
                'URL must start with http:// or https://. '
                'Use https:// for secure URLs.'
            )


class EmailScanSchema(Schema):
    """Validates email content scan requests."""
    content = fields.Str(
        required=True,
        validate=validate.Length(
            min=10,
            max=50000,
            error='Email content must be 10-50,000 characters'
        )
    )


class WebsiteScanSchema(Schema):
    """Validates website scan requests."""
    url = fields.Str(
        required=True,
        validate=validate.Length(min=4, max=2048)
    )

    @validates('url')
    def validate_url_format(self, value, **kwargs):
        if not value.startswith(('http://', 'https://')):
            raise ValidationError('URL must start with http:// or https://')