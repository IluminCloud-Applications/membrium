from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Admin, Settings

integrations_bp = Blueprint('settings_integrations', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ─── Brevo ────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/brevo', methods=['POST'])
@admin_required
def update_brevo():
    data = request.json or request.form
    enabled = data.get('enabled', 'false')
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    api_key = data.get('api_key')
    email_subject = data.get('email_subject')
    email_template = data.get('email_template')
    sender_name = data.get('sender_name')
    sender_email = data.get('sender_email')

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.brevo_enabled = enabled

    if enabled and not api_key:
        return jsonify({'success': False, 'message': 'API Key é obrigatória quando Brevo está habilitado'}), 400

    if enabled:
        settings.brevo_api_key = api_key
        settings.brevo_email_subject = email_subject
        settings.brevo_email_template = email_template
        settings.sender_name = sender_name
        settings.sender_email = sender_email
    else:
        settings.brevo_api_key = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da Brevo atualizadas com sucesso'})


# ─── Evolution API ────────────────────────────────────────────────

@integrations_bp.route('/api/settings/evolution', methods=['POST'])
@admin_required
def update_evolution():
    data = request.json or request.form
    enabled = data.get('enabled', 'false')
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    url = data.get('url')
    api_key = data.get('api_key')
    message_template = data.get('message_template')
    version = data.get('version')
    instance = data.get('instance')

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.evolution_enabled = enabled

    if enabled:
        if not url:
            return jsonify({'success': False, 'message': 'URL é obrigatória'}), 400
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400
        if not version:
            return jsonify({'success': False, 'message': 'Versão da API é obrigatória'}), 400
        if not instance:
            return jsonify({'success': False, 'message': 'Instância do WhatsApp é obrigatória'}), 400

        settings.evolution_url = url
        settings.evolution_api_key = api_key
        settings.evolution_message_template = message_template
        settings.evolution_version = version
        settings.evolution_instance = instance
    else:
        settings.evolution_api_key = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da Evolution API atualizadas com sucesso'})
