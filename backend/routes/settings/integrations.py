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


def _get_or_create_settings():
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    return settings


# ─── GET integrations ─────────────────────────────────────────────

@integrations_bp.route('/api/settings/integrations', methods=['GET'])
@admin_required
def get_integrations():
    settings = _get_or_create_settings()

    return jsonify({
        'brevo': {
            'enabled': settings.brevo_enabled,
            'api_key': settings.brevo_api_key or '',
            'sender_name': settings.sender_name or '',
            'sender_email': settings.sender_email or '',
            'email_subject': settings.brevo_email_subject or '',
            'email_template': settings.brevo_email_template or '',
            'template_mode': settings.brevo_template_mode or 'simple',
        },
        'evolution': {
            'enabled': settings.evolution_enabled,
            'url': settings.evolution_url or '',
            'api_key': settings.evolution_api_key or '',
            'version': settings.evolution_version or '',
            'instance': settings.evolution_instance or '',
            'message_template': settings.evolution_message_template or '',
            'template_mode': settings.evolution_template_mode or 'simple',
        },
        'youtube': {
            'enabled': settings.youtube_enabled,
            'client_id': settings.youtube_client_id or '',
            'client_secret': settings.youtube_client_secret or '',
        }
    })


# ─── Brevo ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/brevo', methods=['POST'])
@admin_required
def update_brevo():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    settings = _get_or_create_settings()
    settings.brevo_enabled = enabled

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando Brevo está habilitado'}), 400
        settings.brevo_api_key = api_key
        settings.sender_name = data.get('sender_name')
        settings.sender_email = data.get('sender_email')
        settings.brevo_email_subject = data.get('email_subject')
        settings.brevo_email_template = data.get('email_template')
        settings.brevo_template_mode = data.get('template_mode', 'simple')
    else:
        settings.brevo_api_key = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da Brevo atualizadas com sucesso'})


# ─── Evolution API ─────────────────────────────────────────────────

@integrations_bp.route('/api/settings/evolution', methods=['POST'])
@admin_required
def update_evolution():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    settings = _get_or_create_settings()
    settings.evolution_enabled = enabled

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

        settings.evolution_url = url
        settings.evolution_api_key = api_key
        settings.evolution_version = version
        settings.evolution_instance = instance
        settings.evolution_message_template = data.get('message_template')
        settings.evolution_template_mode = data.get('template_mode', 'simple')
    else:
        settings.evolution_api_key = None

    db.session.commit()
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
                if isinstance(item, dict) and 'instance' in item:
                    inst = item['instance']
                    name = inst.get('instanceName', '')
                    status = inst.get('status', 'unknown')
                    if name:
                        instances.append({'name': name, 'status': status})

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

    settings = _get_or_create_settings()
    settings.youtube_enabled = enabled

    if enabled:
        client_id = data.get('client_id')
        client_secret = data.get('client_secret')

        if not client_id:
            return jsonify({'success': False, 'message': 'Client ID é obrigatório'}), 400
        if not client_secret:
            return jsonify({'success': False, 'message': 'Client Secret é obrigatório'}), 400

        settings.youtube_client_id = client_id
        settings.youtube_client_secret = client_secret
    else:
        settings.youtube_client_id = None
        settings.youtube_client_secret = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações do YouTube atualizadas com sucesso'})
