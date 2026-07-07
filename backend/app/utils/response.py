# app/utils/response.py
"""
Standardized API response helpers.

Every single endpoint in our API returns the same envelope structure.
This consistency makes frontend error handling trivial — you always
check response.data.success, always find errors in response.data.error.

A common mistake: mixing different response shapes (sometimes you return
{data: ...}, sometimes {result: ...}, sometimes a raw object). Clients
have to handle every case. Consistent envelopes eliminate this.
"""

from flask import jsonify
from datetime import datetime, timezone


def success_response(data=None, message: str = 'Success', status_code: int = 200):
    """
    Return a successful API response.

    Usage:
        return success_response({'user': user.to_dict()}, 'User created', 201)
    """
    return jsonify({
        'success':   True,
        'data':      data,
        'message':   message,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }), status_code


def error_response(error_code: str, message: str, details=None, status_code: int = 400):
    """
    Return an error API response.

    error_code: machine-readable string ('INVALID_URL', 'UNAUTHORIZED', etc.)
    message: human-readable explanation
    details: optional extra data (validation errors, field-level messages)

    Usage:
        return error_response('INVALID_URL', 'URL format is invalid', status_code=422)
    """
    return jsonify({
        'success': False,
        'error': {
            'code':    error_code,
            'message': message,
            'details': details,
        },
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }), status_code


def validation_error_response(errors: dict):
    """
    Return a 422 response for marshmallow validation failures.

    errors: dict of {field_name: [error_message, ...]}
    """
    return error_response(
        error_code='VALIDATION_ERROR',
        message='Request validation failed',
        details=errors,
        status_code=422
    )