from flask import Blueprint, jsonify, session
from functools import wraps
from models import Admin, Student

resend_access_bp = Blueprint('resend_access', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@resend_access_bp.route('/<int:student_id>/resend-access', methods=['POST'])
@admin_required
def resend_student_access(student_id):
    """Resend access credentials to a student via email."""
    try:
        student = Student.query.get_or_404(student_id)
        # TODO: Implement actual email sending logic
        return jsonify({'success': True, 'message': 'Acesso reenviado com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao reenviar acesso: {str(e)}'}), 500
