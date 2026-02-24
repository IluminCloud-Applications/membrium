from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Admin
from db.integration_helpers import get_integration, set_integration

integrations_bp = Blueprint('settings_integrations', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ─── GET integrations ─────────────────────────────────────────────

@integrations_bp.route('/api/settings/integrations', methods=['GET'])
@admin_required
def get_integrations():
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    youtube_enabled, youtube = get_integration('youtube')
    _, support = get_integration('support')

    return jsonify({
        'brevo': {
            'enabled': brevo_enabled,
            'api_key': brevo.get('api_key', ''),
            'sender_name': support.get('sender_name', ''),
            'sender_email': support.get('sender_email', ''),
            'email_subject': brevo.get('email_subject', ''),
            'email_template': brevo.get('email_template', ''),
            'template_mode': brevo.get('template_mode', 'simple'),
            'forgot_email_subject': brevo.get('forgot_email_subject', ''),
            'forgot_email_template': brevo.get('forgot_email_template', ''),
            'forgot_template_mode': brevo.get('forgot_template_mode', 'simple'),
        },
        'evolution': {
            'enabled': evolution_enabled,
            'url': evolution.get('url', ''),
            'api_key': evolution.get('api_key', ''),
            'version': evolution.get('version', ''),
            'instance': evolution.get('instance', ''),
            'message_template': evolution.get('message_template', ''),
            'template_mode': evolution.get('template_mode', 'simple'),
        },
        'youtube': {
            'enabled': youtube_enabled,
            'client_id': youtube.get('client_id', ''),
            'client_secret': youtube.get('client_secret', ''),
            'connected': bool(youtube.get('refresh_token')),
            'channel_name': youtube.get('channel_name', ''),
            'channel_id': youtube.get('channel_id', ''),
        },
    })


# ─── Brevo ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/brevo', methods=['POST'])
@admin_required
def update_brevo():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    config = {}
    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando Brevo está habilitado'}), 400
        config = {
            'api_key': api_key,
            'email_subject': data.get('email_subject'),
            'email_template': data.get('email_template'),
            'template_mode': data.get('template_mode', 'simple'),
            'forgot_email_subject': data.get('forgot_email_subject'),
            'forgot_email_template': data.get('forgot_email_template'),
            'forgot_template_mode': data.get('forgot_template_mode', 'simple'),
        }

        # Sender info goes to support provider
        _, support = get_integration('support')
        support['sender_name'] = data.get('sender_name', support.get('sender_name', ''))
        support['sender_email'] = data.get('sender_email', support.get('sender_email', ''))
        set_integration('support', True, support)
    else:
        # Keep existing config but clear api_key
        _, existing = get_integration('brevo')
        config = existing
        config['api_key'] = None

    set_integration('brevo', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações da Brevo atualizadas com sucesso'})


# ─── Evolution API ─────────────────────────────────────────────────

@integrations_bp.route('/api/settings/evolution', methods=['POST'])
@admin_required
def update_evolution():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    config = {}
    if enabled:
        url = data.get('url')
        api_key = data.get('api_key')
        version = data.get('version')
        instance = data.get('instance')

        if not url:
            return jsonify({'success': False, 'message': 'URL é obrigatória'}), 400
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400
        if not version:
            return jsonify({'success': False, 'message': 'Versão da API é obrigatória'}), 400
        if not instance:
            return jsonify({'success': False, 'message': 'Instância do WhatsApp é obrigatória'}), 400

        config = {
            'url': url,
            'api_key': api_key,
            'version': version,
            'instance': instance,
            'message_template': data.get('message_template'),
            'template_mode': data.get('template_mode', 'simple'),
        }
    else:
        _, existing = get_integration('evolution')
        config = existing
        config['api_key'] = None

    set_integration('evolution', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações da Evolution API atualizadas com sucesso'})


# ─── Evolution API — Detect version ───────────────────────────────

@integrations_bp.route('/api/settings/evolution/detect-version', methods=['POST'])
@admin_required
def detect_evolution_version():
    data = request.json or request.form
    url = data.get('url', '').rstrip('/')
    api_key = data.get('api_key')

    if not url or not api_key:
        return jsonify({'success': False, 'message': 'URL e API Key são obrigatórios'}), 400

    import requests as http_requests
    try:
        # Try v2 endpoint first
        resp = http_requests.get(
            f"{url}/instance/fetchInstances",
            headers={'apikey': api_key},
            timeout=10
        )
        if resp.status_code == 200:
            body = resp.json()
            if isinstance(body, list) and len(body) > 0:
                item = body[0]
                if isinstance(item, dict) and 'instance' in item and 'instanceName' in item['instance']:
                    return jsonify({'success': True, 'version': '2.x.x'})
            return jsonify({'success': True, 'version': '2.x.x'})

        # Fallback: try v1.8.x
        resp_v1 = http_requests.get(
            f"{url}/instance/list",
            headers={'apikey': api_key},
            timeout=10
        )
        if resp_v1.status_code == 200:
            return jsonify({'success': True, 'version': '1.8.x'})

        return jsonify({'success': False, 'message': f'Não foi possível detectar a versão (status {resp.status_code})'}), 400

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à Evolution API'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à Evolution API'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Evolution API — Fetch instances ──────────────────────────────

@integrations_bp.route('/api/settings/evolution/instances', methods=['POST'])
@admin_required
def fetch_evolution_instances():
    data = request.json or request.form
    url = data.get('url', '').rstrip('/')
    api_key = data.get('api_key')

    if not url or not api_key:
        return jsonify({'success': False, 'message': 'URL e API Key são obrigatórios'}), 400

    import requests as http_requests
    try:
        resp = http_requests.get(
            f"{url}/instance/fetchInstances",
            headers={'apikey': api_key},
            timeout=10
        )

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'Erro da API: {resp.status_code}'}), 400

        body = resp.json()
        instances = []

        if isinstance(body, list):
            for item in body:
                if not isinstance(item, dict):
                    continue

                name = item.get('name', '')
                status = item.get('connectionStatus', 'unknown')
                owner_jid = item.get('ownerJid', '')

                phone = ''
                if owner_jid and '@' in owner_jid:
                    phone = owner_jid.split('@')[0]

                if name:
                    instances.append({
                        'name': name,
                        'status': status,
                        'phone': phone,
                    })

        return jsonify({'success': True, 'instances': instances})

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à Evolution API'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à Evolution API'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── YouTube ───────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/youtube', methods=['POST'])
@admin_required
def update_youtube():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('youtube')
    config = existing.copy()

    if enabled:
        client_id = data.get('client_id')
        client_secret = data.get('client_secret')

        if not client_id:
            return jsonify({'success': False, 'message': 'Client ID é obrigatório'}), 400
        if not client_secret:
            return jsonify({'success': False, 'message': 'Client Secret é obrigatório'}), 400

        config['client_id'] = client_id
        config['client_secret'] = client_secret
    else:
        config['client_id'] = None
        config['client_secret'] = None

    set_integration('youtube', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações do YouTube atualizadas com sucesso'})
