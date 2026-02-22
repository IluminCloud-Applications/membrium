from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from db.database import db
from models import Student

member_profile_bp = Blueprint('member_profile', __name__)


def student_required(f):
    """Ensures the user is a logged-in student."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'student':
            return jsonify({'error': 'Não autorizado'}), 401
        student = Student.query.get(session['user_id'])
        if not student:
            return jsonify({'error': 'Aluno não encontrado'}), 401
        return f(student, *args, **kwargs)
    return decorated


@member_profile_bp.route('/profile', methods=['GET'])
@student_required
def get_profile(student):
    """Returns the student's profile info."""
    from models import Admin
    admin = Admin.query.first()

    return jsonify({
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'phone': student.phone or '',
        'platformName': admin.platform_name if admin else 'Membrium',
    })


@member_profile_bp.route('/profile', methods=['PUT'])
@student_required
def update_profile(student):
    """Updates student name and phone."""
    data = request.json
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()

    if not name:
        return jsonify({'error': 'Nome é obrigatório'}), 400

    student.name = name
    student.phone = phone or None
    db.session.commit()

    return jsonify({'success': True, 'message': 'Perfil atualizado com sucesso!'})


@member_profile_bp.route('/profile/password', methods=['PUT'])
@student_required
def update_password(student):
    """Updates the student's password."""
    data = request.json
    new_password = data.get('new_password', '')

    if not new_password or len(new_password) < 4:
        return jsonify({'error': 'Senha deve ter no mínimo 4 caracteres'}), 400

    student.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Senha atualizada com sucesso!'})
