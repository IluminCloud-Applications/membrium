"""
Chatbot Config Routes — Configuração e gerenciamento do chatbot.

Endpoints:
- GET  /api/chatbot/config   → Configuração pública (sem API keys)
- GET  /api/chatbot/settings → Todas as configurações (admin)
- POST /api/chatbot/settings → Atualizar configurações
- POST /api/chatbot/avatar   → Upload de avatar
"""

import os
from flask import Blueprint, request, jsonify, session, current_app
from functools import wraps
from models import Admin
from db.database import db
from db.integration_helpers import get_integration, set_integration

config_bp = Blueprint('chatbot_config', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({"error": "Acesso não autorizado."}), 403
        if not Admin.query.get(session['user_id']):
            return jsonify({"error": "Acesso não autorizado."}), 403
        return f(*args, **kwargs)
    return decorated_function


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_type' not in session or session['user_type'] != 'student':
            return jsonify({"error": "Acesso não autorizado."}), 403
        return f(*args, **kwargs)
    return decorated_function


@config_bp.route('/config', methods=['GET'])
def get_chatbot_config():
    """Retorna a configuração pública do chatbot (sem chaves API)."""
    enabled, config = get_integration('chatbot')

    if not enabled:
        return jsonify({"enabled": False})

    return jsonify({
        "enabled": enabled,
        "provider": config.get('provider'),
        "avatar": config.get('avatar'),
        "name": config.get('name'),
        "welcome_message": config.get('welcome_message') or "Olá! Como posso ajudar com seus estudos hoje?",
    })


@config_bp.route('/settings', methods=['GET'])
@admin_required
def get_chatbot_settings():
    """Retorna todas as configurações do chatbot para o admin."""
    enabled, config = get_integration('chatbot')

    return jsonify({
        "enabled": enabled,
        "provider": config.get('provider'),
        "model": config.get('model'),
        "name": config.get('name'),
        "avatar": config.get('avatar'),
        "welcome_message": config.get('welcome_message'),
        "use_internal_knowledge": config.get('use_internal_knowledge', False),
    })


@config_bp.route('/settings', methods=['POST'])
@admin_required
def update_chatbot_settings():
    """Atualiza as configurações do chatbot."""
    data = request.json

    config = {
        'provider': data.get('provider'),
        'model': data.get('model'),
        'name': data.get('name'),
        'avatar': data.get('avatar'),
        'welcome_message': data.get('welcome_message'),
        'use_internal_knowledge': data.get('use_internal_knowledge', False),
    }

    # Preservar avatar existente se não for enviado
    _, existing = get_integration('chatbot')
    if not config.get('avatar') and existing.get('avatar'):
        config['avatar'] = existing['avatar']

    set_integration('chatbot', data.get('enabled', False), config)
    return jsonify({"success": True, "message": "Configurações do chatbot atualizadas com sucesso!"})


@config_bp.route('/avatar', methods=['POST'])
@admin_required
def upload_chatbot_avatar():
    """Upload de avatar para o chatbot."""
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    filename = f"chatbot_avatar_{file.filename}"
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Atualizar avatar no config do chatbot
    enabled, config = get_integration('chatbot')
    config['avatar'] = f"/static/uploads/{filename}"
    set_integration('chatbot', enabled, config)

    return jsonify({
        "success": True,
        "filename": filename,
        "url": f"/static/uploads/{filename}",
    })
