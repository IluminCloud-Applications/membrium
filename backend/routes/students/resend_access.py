from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from models import Admin, Student
from db.integration_helpers import get_integration
from integrations import dispatch_notifications
import secrets
import logging

logger = logging.getLogger(__name__)

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


def _get_settings_dict():
    """Retorna as configurações como dicionário."""
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    _, support = get_integration('support')

    return {
        'brevo_enabled': brevo_enabled,
        'brevo_api_key': brevo.get('api_key'),
        'brevo_email_subject': brevo.get('email_subject'),
        'brevo_email_template': brevo.get('email_template'),
        'brevo_template_mode': brevo.get('template_mode'),
        'brevo_forgot_email_subject': brevo.get('forgot_email_subject'),
        'brevo_forgot_email_template': brevo.get('forgot_email_template'),
        'brevo_forgot_template_mode': brevo.get('forgot_template_mode'),
        'sender_name': support.get('sender_name'),
        'sender_email': support.get('sender_email'),
        'support_email': support.get('email'),
        'evolution_enabled': evolution_enabled,
        'evolution_url': evolution.get('url'),
        'evolution_api_key': evolution.get('api_key'),
        'evolution_message_template': evolution.get('message_template'),
        'evolution_version': evolution.get('version'),
        'evolution_instance': evolution.get('instance'),
    }


def _get_base_url():
    """Retorna a URL base da aplicação."""
    proto = request.headers.get('X-Forwarded-Proto')
    host = request.headers.get('X-Forwarded-Host')
    if proto and host:
        return f"{proto}://{host}"
    return request.url_root.rstrip('/')


@resend_access_bp.route('/<int:student_id>/resend-access', methods=['POST'])
@admin_required
def resend_student_access(student_id):
    """
    Reenvia credenciais de acesso ao aluno via integrações configuradas
    (email Brevo e/ou WhatsApp Evolution API).
    Gera uma nova senha temporária para o aluno.
    """
    try:
        student = Student.query.get_or_404(student_id)

        # Gerar nova senha temporária
        new_password = secrets.token_urlsafe(8)
        student.set_password(new_password)

        from db.database import db
        db.session.commit()

        # Obter configurações e URL base
        settings_dict = _get_settings_dict()
        base_url = _get_base_url()

        # Montar dados do aluno para o template
        courses_names = ', '.join([c.name for c in student.courses]) if student.courses else 'Nenhum curso'

        student_data = {
            'name': student.name,
            'first_name': student.name.split()[0] if student.name else student.name,
            'email': student.email,
            'password': new_password,
            'link': f"{base_url}/login",
            'fast_link': f"{base_url}/access/{student.uuid}",
            'curso': courses_names,
            'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
        }

        # Disparar notificações via dispatcher
        results = dispatch_notifications(
            settings_dict=settings_dict,
            student_data=student_data,
            phone=student.phone,
        )

        logger.info(f"Resend access results for {student.email}: {results}")

        # Verificar se alguma notificação foi enviada
        email_sent = results.get('email', {}).get('sent', False)
        whatsapp_sent = results.get('whatsapp', {}).get('sent', False)

        if not email_sent and not whatsapp_sent:
            # Nenhuma integração configurada/enviada
            reasons = []
            email_reason = results.get('email', {}).get('reason', '')
            whatsapp_reason = results.get('whatsapp', {}).get('reason', '')

            if email_reason == 'not_configured':
                reasons.append('Email não configurado')
            if email_reason == 'blacklisted':
                reasons.append('Email na blacklist')
            if whatsapp_reason == 'not_configured':
                reasons.append('WhatsApp não configurado')
            if whatsapp_reason == 'no_phone':
                reasons.append('Aluno sem telefone')

            reason_text = '; '.join(reasons) if reasons else 'Nenhuma integração habilitada'
            return jsonify({
                'success': False,
                'message': f'Não foi possível reenviar: {reason_text}',
                'results': results,
            }), 400

        # Montar mensagem de sucesso
        channels = []
        if email_sent:
            channels.append('email')
        if whatsapp_sent:
            channels.append('WhatsApp')

        channel_text = ' e '.join(channels)

        return jsonify({
            'success': True,
            'message': f'Acesso reenviado com sucesso via {channel_text}',
            'results': results,
        })

    except Exception as e:
        logger.error(f"Erro ao reenviar acesso: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao reenviar acesso: {str(e)}'
        }), 500
