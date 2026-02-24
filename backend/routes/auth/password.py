"""
Password routes: reset, forgot password, and change password by UUID.
"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db.database import db
from models import Student
from db.integration_helpers import get_integration
from integrations.email.brevo import send_brevo_forgot_email
import logging

logger = logging.getLogger(__name__)

password_bp = Blueprint('password', __name__)


def _get_settings_dict():
    """Retorna as configurações como dicionário para envio de email."""
    brevo_enabled, brevo = get_integration('brevo')
    _, support = get_integration('support')

    return {
        'brevo_enabled': brevo_enabled,
        'brevo_api_key': brevo.get('api_key'),
        'brevo_forgot_email_subject': brevo.get('forgot_email_subject'),
        'brevo_forgot_email_template': brevo.get('forgot_email_template'),
        'brevo_forgot_template_mode': brevo.get('forgot_template_mode'),
        'sender_name': support.get('sender_name'),
        'sender_email': support.get('sender_email'),
        'support_email': support.get('email'),
    }


def _get_base_url():
    """Retorna a URL base da aplicação."""
    proto = request.headers.get('X-Forwarded-Proto')
    host = request.headers.get('X-Forwarded-Host')
    if proto and host:
        return f"{proto}://{host}"
    return request.url_root.rstrip('/')


@password_bp.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    """Reset student password (from login modal — direct reset)."""
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


@password_bp.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    """
    Envia email de recuperação de senha.
    Não revela se o email existe ou não (segurança).
    """
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'success': False, 'message': 'E-mail é obrigatório'}), 400

    # Sempre retorna sucesso para o frontend (segurança)
    student = Student.query.filter_by(email=email).first()
    if not student:
        logger.info(f"[ForgotPassword] Email não encontrado: {email}")
        return jsonify({
            'success': True,
            'message': 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.'
        })

    # Montar dados para o template
    settings_dict = _get_settings_dict()
    base_url = _get_base_url()

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'link': f"{base_url}/login",
        'recovery_link': f"{base_url}/change-password?id={student.uuid}",
    }

    # Enviar email via Brevo
    success, message = send_brevo_forgot_email(settings_dict, student_data)

    if not success:
        logger.error(f"[ForgotPassword] Erro ao enviar email: {message}")
        return jsonify({
            'success': False,
            'message': f'Erro ao enviar email de recuperação: {message}'
        }), 500

    logger.info(f"[ForgotPassword] Email de recuperação enviado para {email}")
    return jsonify({
        'success': True,
        'message': 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.'
    })


@password_bp.route('/api/auth/change-password', methods=['POST'])
def api_change_password():
    """
    Altera a senha do aluno usando o UUID como identificador.
    Rota usada pela página /change-password?id=UUID.
    """
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    uuid = data.get('uuid', '').strip()
    new_password = data.get('newPassword', '')

    if not uuid:
        return jsonify({'success': False, 'message': 'Token inválido'}), 400

    if not new_password or len(new_password) < 6:
        return jsonify({'success': False, 'message': 'A senha deve ter pelo menos 6 caracteres'}), 400

    student = Student.query.filter_by(uuid=uuid).first()
    if not student:
        return jsonify({'success': False, 'message': 'Token inválido ou expirado'}), 404

    student.password = generate_password_hash(new_password)
    db.session.commit()

    logger.info(f"[ChangePassword] Senha alterada para {student.email}")
    return jsonify({'success': True, 'message': 'Senha alterada com sucesso!'})
