"""Session management — check current authenticated user."""
from flask import Blueprint, session, jsonify, redirect
from models import Admin, Student
from db.utils import check_installation

session_bp = Blueprint('session', __name__)


@session_bp.route('/api/auth/me', methods=['GET'])
def api_me():
    """Get current user info (check session)."""
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401

    user_type = session.get('user_type')

    if user_type == 'admin':
        admin = Admin.query.get(session['user_id'])
        if admin:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': admin.id,
                    'type': 'admin',
                    'email': admin.email,
                    'name': admin.name or 'Admin',
                },
            })
    elif user_type == 'student':
        student = Student.query.get(session['user_id'])
        if student:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': student.id,
                    'type': 'student',
                    'email': student.email,
                    'name': student.name,
                },
            })

    session.clear()
    return jsonify({'authenticated': False}), 401


@session_bp.route('/')
def index():
    """Root redirect — sends to frontend routes."""
    if 'user_id' in session:
        if session.get('user_type') == 'admin':
            return redirect('/admin')
        elif session.get('user_type') == 'student':
            return redirect('/member')

    if check_installation():
        return redirect('/login')
    else:
        return redirect('/setup')
