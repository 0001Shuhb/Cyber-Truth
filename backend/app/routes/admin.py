# app/routes/admin.py
"""
Admin-only endpoints.

These routes are protected by TWO layers:
1. JWT authentication (must be logged in)
2. Role check (must be 'admin')

HOW ROLE CHECK WORKS:
The JWT payload contains {'sub': user_id, 'role': 'admin'}.
The @admin_required decorator extracts this and verifies it.
This is faster than a DB query on every request — the role is
baked into the token itself.

CAVEAT: If you demote an admin user while their token is still
valid, they'll retain admin access until the token expires (15 min).
For immediate revocation, you'd need a token blacklist.
"""

from functools import wraps
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func

from ..extensions import db, limiter
from ..models.user import User
from ..models.scan import Scan
from ..utils.response import success_response, error_response

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """
    Decorator: verifies the current user has the 'admin' role.

    Uses the 'role' claim embedded in the JWT (set at login time).
    This avoids a database query on every admin endpoint.

    Usage:
        @admin_bp.route('/users')
        @jwt_required()
        @admin_required
        def list_users():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()  # Get all JWT payload claims
        if claims.get('role') != 'admin':
            return error_response(
                'FORBIDDEN',
                'Admin privileges required for this operation.',
                status_code=403
            )
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
@limiter.limit('30 per minute')
def list_users():
    """GET /api/admin/users — Paginated list of all users."""
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search   = request.args.get('search', '').strip()

    query = User.query
    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return success_response(
        data={
            'users': [u.to_dict(include_private=True) for u in pagination.items],
            'pagination': {
                'total': pagination.total,
                'page':  pagination.page,
                'pages': pagination.pages,
            }
        }
    )


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """
    PUT /api/admin/users/<user_id>

    Update a user's role or active status.

    An admin cannot demote themselves (prevents lockout).
    """
    current_admin_id = get_jwt_identity()

    if user_id == current_admin_id:
        return error_response(
            'SELF_MODIFY_FORBIDDEN',
            'You cannot modify your own account via the admin panel.',
            status_code=400
        )

    user = User.query.get(user_id)
    if not user:
        return error_response('USER_NOT_FOUND', 'User not found.', status_code=404)

    data = request.get_json(silent=True) or {}

    if 'role' in data and data['role'] in ('user', 'admin'):
        user.role = data['role']

    if 'is_active' in data and isinstance(data['is_active'], bool):
        user.is_active = data['is_active']

    db.session.commit()

    return success_response(
        data={'user': user.to_dict(include_private=True)},
        message='User updated.'
    )


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def platform_stats():
    """GET /api/admin/stats — Platform-wide statistics."""
    total_users  = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_scans  = Scan.query.count()

    scan_breakdown = db.session.query(
        Scan.risk_label,
        func.count(Scan.id)
    ).group_by(Scan.risk_label).all()

    scan_by_type = db.session.query(
        Scan.scan_type,
        func.count(Scan.id)
    ).group_by(Scan.scan_type).all()

    return success_response(
        data={
            'users': {
                'total':  total_users,
                'active': active_users,
            },
            'scans': {
                'total':      total_scans,
                'by_label':   dict(scan_breakdown),
                'by_type':    dict(scan_by_type),
            }
        }
    )