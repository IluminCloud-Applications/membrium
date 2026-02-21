from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from db.database import db
from models import Admin, Student, Course

create_student_bp = Blueprint('create_student', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@create_student_bp.route('/', methods=['POST'])
@admin_required
def create_student():
    """Create a new student and optionally enroll in a course."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    course_id = data.get('courseId')

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Nome, email e senha são obrigatórios'}), 400

    hashed_password = generate_password_hash(password)

    try:
        new_student = Student(email=email, password=hashed_password, name=name)
        db.session.add(new_student)
        db.session.flush()

        if course_id:
            course = Course.query.get(course_id)
            if course:
                new_student.courses.append(course)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aluno criado com sucesso',
            'student': {
                'id': new_student.id,
                'name': new_student.name,
                'email': new_student.email,
                'status': 'active' if new_student.courses else 'inactive',
                'courses': [{'id': c.id, 'name': c.name} for c in new_student.courses],
                'quickAccessToken': new_student.uuid,
            }
        })

    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Email já está em uso'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500
