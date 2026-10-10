from flask import Blueprint, jsonify, session
from auth_decorators import admin_required
from functools import wraps
from models import Admin

user_info_bp = Blueprint('dashboard_user_info', __name__)


@user_info_bp.route('/user-info', methods=['GET'])
@admin_required
def get_user_info():
    """Return current admin user info for dashboard/sidebar."""
    admin = Admin.query.get(session['user_id'])

    return jsonify({
        'id': admin.id,
        'name': admin.name or 'Admin',
        'email': admin.email,
        'platform_name': admin.platform_name,
        'role': admin.role,
    })
