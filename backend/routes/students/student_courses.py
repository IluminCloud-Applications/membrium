from flask import Blueprint, jsonify, session, request
from functools import wraps
from db.database import db
from models import Admin, Student, Course

student_courses_bp = Blueprint('student_courses', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@student_courses_bp.route('/<int:student_id>/courses', methods=['POST'])
@admin_required
def add_course_to_student(student_id):
    """Add a course to a student's enrollment."""
    student = Student.query.get_or_404(student_id)
    data = request.get_json()

    course_id = data.get('courseId')
    if not course_id:
        return jsonify({'success': False, 'message': 'ID do curso não fornecido'}), 400

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Curso não encontrado'}), 404

    if course in student.courses:
        return jsonify({'success': False, 'message': 'Aluno já está matriculado neste curso'}), 400

    try:
        student.courses.append(course)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Curso adicionado com sucesso',
            'courses': [{'id': c.id, 'name': c.name} for c in student.courses],
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro: {str(e)}'}), 500


@student_courses_bp.route('/<int:student_id>/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def remove_course_from_student(student_id, course_id):
    """Remove a course from a student's enrollment."""
    student = Student.query.get_or_404(student_id)
    course = Course.query.get_or_404(course_id)

    if course not in student.courses:
        return jsonify({'success': False, 'message': 'Aluno não está matriculado neste curso'}), 400

    try:
        student.courses.remove(course)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Curso removido com sucesso',
            'courses': [{'id': c.id, 'name': c.name} for c in student.courses],
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro: {str(e)}'}), 500
