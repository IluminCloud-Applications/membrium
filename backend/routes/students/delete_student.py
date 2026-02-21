from flask import Blueprint, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, Student

delete_student_bp = Blueprint('delete_student', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@delete_student_bp.route('/<int:student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    """Delete a student permanently."""
    student = Student.query.get_or_404(student_id)

    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Aluno excluído com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir: {str(e)}'}), 500
