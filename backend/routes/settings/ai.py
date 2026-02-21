from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Admin, Settings
import requests as http_requests

ai_bp = Blueprint('settings_ai', __name__)


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


# ─── GET AI settings ──────────────────────────────────────────────

@ai_bp.route('/api/settings/ai', methods=['GET'])
@admin_required
def get_ai_settings():
    settings = _get_or_create_settings()

    return jsonify({
        'gemini': {
            'enabled': settings.gemini_api_enabled,
            'api_key': settings.gemini_api_key or '',
        },
        'openai': {
            'enabled': settings.openai_api_enabled,
            'api_key': settings.openai_api or '',
        },
        'chatbot': {
            'enabled': settings.chatbot_enabled,
            'name': settings.chatbot_name or '',
            'provider': settings.chatbot_provider or '',
            'model': settings.chatbot_model or '',
            'welcome_message': settings.chatbot_welcome_message or '',
            'use_internal_knowledge': settings.chatbot_use_internal_knowledge,
        }
    })


# ─── Gemini ───────────────────────────────────────────────────────

@ai_bp.route('/api/settings/gemini', methods=['POST'])
@admin_required
def update_gemini():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    settings = _get_or_create_settings()
    settings.gemini_api_enabled = enabled

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400
        settings.gemini_api_key = api_key
    else:
        settings.gemini_api_key = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações do Gemini atualizadas com sucesso'})


# ─── OpenAI ───────────────────────────────────────────────────────

@ai_bp.route('/api/settings/openai', methods=['POST'])
@admin_required
def update_openai():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    settings = _get_or_create_settings()
    settings.openai_api_enabled = enabled

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400
        settings.openai_api = api_key
    else:
        settings.openai_api = None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da OpenAI atualizadas com sucesso'})


# ─── Chatbot ──────────────────────────────────────────────────────

@ai_bp.route('/api/settings/chatbot', methods=['POST'])
@admin_required
def update_chatbot():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    settings = _get_or_create_settings()
    settings.chatbot_enabled = enabled

    if enabled:
        settings.chatbot_name = data.get('name', '')
        settings.chatbot_provider = data.get('provider', '')
        settings.chatbot_model = data.get('model', '')
        settings.chatbot_welcome_message = data.get('welcome_message', '')
        settings.chatbot_use_internal_knowledge = bool(data.get('use_internal_knowledge', False))

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações do Chatbot atualizadas com sucesso'})


# ─── Fetch Gemini models (proxy) ──────────────────────────────────

@ai_bp.route('/api/settings/ai/gemini-models', methods=['POST'])
@admin_required
def fetch_gemini_models():
    data = request.json or request.form
    api_key = data.get('api_key', '')

    if not api_key:
        return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400

    try:
        resp = http_requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=15
        )

        if resp.status_code == 400 or resp.status_code == 403:
            return jsonify({'success': False, 'message': 'API Key inválida ou sem permissão'}), 400

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'Erro da API: {resp.status_code}'}), 400

        body = resp.json()
        raw_models = body.get('models', [])

        # Filter only text generation models (generateContent)
        models = []
        for m in raw_models:
            methods = m.get('supportedGenerationMethods', [])
            if 'generateContent' in methods:
                models.append({
                    'id': m.get('name', '').replace('models/', ''),
                    'name': m.get('displayName', ''),
                    'description': m.get('description', ''),
                })

        return jsonify({'success': True, 'models': models})

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à API do Google'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à API do Google'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Fetch OpenAI models (proxy) ──────────────────────────────────

@ai_bp.route('/api/settings/ai/openai-models', methods=['POST'])
@admin_required
def fetch_openai_models():
    data = request.json or request.form
    api_key = data.get('api_key', '')

    if not api_key:
        return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400

    try:
        resp = http_requests.get(
            "https://api.openai.com/v1/models",
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            timeout=15
        )

        if resp.status_code == 401:
            return jsonify({'success': False, 'message': 'API Key inválida'}), 400

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'Erro da API: {resp.status_code}'}), 400

        body = resp.json()
        raw_models = body.get('data', [])

        # Filter only GPT chat models
        chat_prefixes = ('gpt-', 'o1', 'o3', 'o4')
        models = []
        for m in raw_models:
            model_id = m.get('id', '')
            if any(model_id.startswith(p) for p in chat_prefixes):
                models.append({
                    'id': model_id,
                    'name': model_id,
                })

        # Sort alphabetically
        models.sort(key=lambda x: x['id'])

        return jsonify({'success': True, 'models': models})

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à API da OpenAI'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à API da OpenAI'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
