"""Password reset routes."""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db.database import db
from models import Student

password_bp = Blueprint('password', __name__)


@password_bp.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    """Reset student password."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    email = data.get('email', '').strip()
    new_password = data.get('newPassword', '')

    if not email or not new_password:
        return jsonify({'success': False, 'message': 'E-mail e nova senha são obrigatórios'}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'success': False, 'message': 'Email não encontrado'}), 404

    hashed_password = generate_password_hash(new_password)
    student.password = hashed_password
    db.session.commit()

    return jsonify({'success': True, 'message': 'Senha redefinida com sucesso!'})
