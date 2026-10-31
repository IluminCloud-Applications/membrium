from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from models import Admin, Student
from db.integration_helpers import get_integration
from integrations import dispatch_notifications
from integrations.utils.url_helper import ensure_https, sanitize_notification_urls
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
    """Retorna a URL base da aplicação sempre com https://, priorizando CUSTOM_DOMAIN se configurado."""
    import os
    custom_domain = os.environ.get('CUSTOM_DOMAIN')
    if custom_domain and custom_domain.strip():
        return ensure_https(custom_domain.strip()).rstrip('/')

    host = request.headers.get('X-Forwarded-Host') or request.host
    if host:
        return ensure_https(host).rstrip('/')

    return ensure_https(request.url_root.rstrip('/'))


@resend_access_bp.route('/<int:student_id>/resend-access', methods=['POST'])
@admin_required
def resend_student_access(student_id):
    """
    Reenvia credenciais de acesso ao aluno via integrações configuradas
    (email Brevo e/ou WhatsApp Evolution API).
    Utiliza a senha padrão configurada na plataforma (ou customizada enviada no payload)
    e sincroniza a senha no banco de dados.
    """
    try:
        student = Student.query.get_or_404(student_id)

        # Obter senha padrão configurada em Configurações > Geral > Cadastro de Alunos
        _, signup_config = get_integration('student_signup')
        default_pw = signup_config.get('new_student_password', '').strip() or 'senha123'

        # Se enviou senha customizada no body, utiliza; caso contrário usa a senha padrão
        req_data = request.get_json(silent=True) or {}
        password_to_use = req_data.get('password', '').strip() or default_pw

        # Sincroniza a senha no banco de dados para garantir que a senha real do aluno seja essa
        student.set_password(password_to_use)

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
            'password': password_to_use,
            'link': f"{base_url}/login",
            'fast_link': f"{base_url}/access/{student.uuid}",
            'curso': courses_names,
            'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
            'base_url': base_url,
        }

        # Forçar HTTPS em todos os campos de URL
        student_data = sanitize_notification_urls(student_data)

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
