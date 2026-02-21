from flask import Blueprint, jsonify, session
from functools import wraps
from models import Admin

user_info_bp = Blueprint('dashboard_user_info', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


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
    })
