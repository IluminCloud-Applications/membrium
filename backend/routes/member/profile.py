from flask import Blueprint, jsonify, session, request
from werkzeug.security import generate_password_hash
from db.database import db
from models import Student, Admin, Settings
from .auth_helpers import student_required, member_or_preview

member_profile_bp = Blueprint('member_profile', __name__)


def _get_support_info():
    """Returns support contact info from Settings."""
    settings = Settings.query.first()
    return {
        'supportEmail': (settings.support_email or '') if settings else '',
        'supportWhatsapp': (settings.support_whatsapp or '') if settings else '',
    }


@member_profile_bp.route('/profile', methods=['GET'])
@member_or_preview
def get_profile(student):
    """Returns the student's profile info.
    In admin preview mode (student=None), returns admin info."""
    admin = Admin.query.first()
    platform_name = admin.platform_name if admin else 'Membrium'
    support = _get_support_info()

    if student is None:
        # Admin preview mode
        return jsonify({
            'id': admin.id if admin else 0,
            'name': admin.name or 'Admin',
            'email': admin.email if admin else '',
            'phone': '',
            'platformName': platform_name,
            **support,
        })

    return jsonify({
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'phone': student.phone or '',
        'platformName': platform_name,
        **support,
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
