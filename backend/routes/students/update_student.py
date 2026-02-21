from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from db.database import db
from models import Admin, Student

update_student_bp = Blueprint('update_student', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@update_student_bp.route('/<int:student_id>', methods=['PUT'])
@admin_required
def update_student(student_id):
    """Update student name, email, and optionally password."""
    student = Student.query.get_or_404(student_id)
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    try:
        new_email = data.get('email', student.email).strip().lower()

        # Block student email from being the same as admin email
        admin = Admin.query.get(session['user_id'])
        if admin and admin.email.lower() == new_email:
            return jsonify({'success': False, 'message': 'O email do aluno não pode ser igual ao do administrador'}), 400

        student.name = data.get('name', student.name).strip()
        student.email = new_email

        new_password = data.get('password', '').strip()
        if new_password:
            student.password = generate_password_hash(new_password)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aluno atualizado com sucesso',
            'student': {
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'status': 'active' if student.courses else 'inactive',
                'courses': [{'id': c.id, 'name': c.name} for c in student.courses],
                'quickAccessToken': student.uuid,
            }
        })

    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Email já está em uso'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500
