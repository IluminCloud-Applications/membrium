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
from models import Admin, Settings
from db.database import db

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
    settings = Settings.query.first()
    
    if not settings or not settings.chatbot_enabled:
        return jsonify({"enabled": False})
    
    return jsonify({
        "enabled": settings.chatbot_enabled,
        "provider": settings.chatbot_provider,
        "avatar": settings.chatbot_avatar,
        "name": settings.chatbot_name,
        "welcome_message": settings.chatbot_welcome_message or "Olá! Como posso ajudar com seus estudos hoje?",
    })


@config_bp.route('/settings', methods=['GET'])
@admin_required
def get_chatbot_settings():
    """Retorna todas as configurações do chatbot para o admin."""
    settings = Settings.query.first()
    
    if not settings:
        return jsonify({"error": "Configurações não encontradas"}), 404
    
    return jsonify({
        "enabled": settings.chatbot_enabled,
        "provider": settings.chatbot_provider,
        "model": settings.chatbot_model,
        "name": settings.chatbot_name,
        "avatar": settings.chatbot_avatar,
        "welcome_message": settings.chatbot_welcome_message,
        "use_internal_knowledge": settings.chatbot_use_internal_knowledge,
    })


@config_bp.route('/settings', methods=['POST'])
@admin_required
def update_chatbot_settings():
    """Atualiza as configurações do chatbot."""
    settings = Settings.query.first()
    
    if not settings:
        return jsonify({"error": "Configurações não encontradas"}), 404
    
    data = request.json
    settings.chatbot_enabled = data.get('enabled', False)
    settings.chatbot_provider = data.get('provider')
    settings.chatbot_model = data.get('model')
    settings.chatbot_name = data.get('name')
    settings.chatbot_avatar = data.get('avatar')
    settings.chatbot_welcome_message = data.get('welcome_message')
    settings.chatbot_use_internal_knowledge = data.get('use_internal_knowledge', False)
    
    db.session.commit()
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
    
    settings = Settings.query.first()
    if settings:
        settings.chatbot_avatar = f"/static/uploads/{filename}"
        db.session.commit()
    
    return jsonify({
        "success": True,
        "filename": filename,
        "url": f"/static/uploads/{filename}",
    })
