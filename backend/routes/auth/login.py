"""Login and logout routes."""
from flask import Blueprint, request, session, jsonify
from werkzeug.security import check_password_hash
from models import Admin, Student

login_bp = Blueprint('login', __name__)


@login_bp.route('/api/auth/login', methods=['POST'])
def api_login():
    """Login as admin or student (JSON API)."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'E-mail e senha são obrigatórios'}), 400

    # Try admin
    admin = Admin.query.filter_by(email=email).first()
    if admin and check_password_hash(admin.password, password):
        session.permanent = True
        session['user_id'] = admin.id
        session['user_type'] = 'admin'
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso!',
            'user': {
                'id': admin.id,
                'type': 'admin',
                'email': admin.email,
                'name': admin.name or 'Admin',
            },
        })

    # Try student
    student = Student.query.filter_by(email=email).first()
    if student and check_password_hash(student.password, password):
        session.permanent = True
        session['user_id'] = student.id
        session['user_type'] = 'student'
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso!',
            'user': {
                'id': student.id,
                'type': 'student',
                'email': student.email,
                'name': student.name,
            },
        })

    return jsonify({'success': False, 'message': 'Email ou senha inválidos.'}), 401


@login_bp.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """Logout current user."""
    session.clear()
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso!'})
