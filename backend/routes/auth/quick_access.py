"""Quick access — authenticate student via UUID link."""
from flask import Blueprint, session, jsonify, redirect
from models import Student

quick_access_bp = Blueprint('quick_access', __name__)


@quick_access_bp.route('/api/auth/quick-access/<uuid>', methods=['POST'])
def api_quick_access(uuid):
    """Quick access — authenticate student by UUID token (JSON API)."""
    student = Student.query.filter_by(uuid=uuid).first()
    if not student:
        return jsonify({'success': False, 'message': 'Link de acesso inválido'}), 404

    session.permanent = True
    session['user_id'] = student.id
    session['user_type'] = 'student'
    return jsonify({
        'success': True,
        'message': 'Acesso rápido realizado com sucesso!',
        'user': {
            'id': student.id,
            'type': 'student',
            'email': student.email,
            'name': student.name,
        },
    })


@quick_access_bp.route('/access/<uuid>')
def quick_access_redirect(uuid):
    """Legacy quick access — redirect to frontend route."""
    return redirect(f'/quick-access/{uuid}')
