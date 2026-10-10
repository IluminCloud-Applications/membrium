"""Developer API settings routes — generate, view and revoke external API keys."""
import os
import secrets
from flask import Blueprint, jsonify, session, request
from auth_decorators import admin_required
from functools import wraps
from db.database import db
from models import Admin

developer_api_bp = Blueprint('settings_developer_api', __name__)


def _get_base_url():
    """Retorna a URL base pública da aplicação, respeitando CUSTOM_DOMAIN e headers de proxy."""
    custom_domain = os.environ.get('CUSTOM_DOMAIN')
    if custom_domain and custom_domain.strip():
        domain = custom_domain.strip()
        if not domain.startswith(('http://', 'https://')):
            domain = f"https://{domain}"
        return domain.rstrip('/')

    proto = request.headers.get('X-Forwarded-Proto')
    host = request.headers.get('X-Forwarded-Host')
    if proto and host:
        return f"{proto}://{host}".rstrip('/')

    return request.url_root.rstrip('/')


@developer_api_bp.route('/api/settings/developer-api', methods=['GET'])
@admin_required
def get_developer_api():
    """Retorna a chave de API externa ativa e a URL base para cURLs."""
    admin = Admin.query.get(session['user_id'])

    # Se este admin não tem chave, verifica se outro admin na plataforma tem (para compartilhamento de plataforma)
    api_key = admin.api_key if admin else None
    if not api_key:
        other_admin = Admin.query.filter(Admin.api_key.isnot(None)).first()
        if other_admin:
            api_key = other_admin.api_key

    return jsonify({
        'success': True,
        'has_key': bool(api_key),
        'api_key': api_key or '',
        'base_url': _get_base_url(),
    })


@developer_api_bp.route('/api/settings/developer-api/generate', methods=['POST'])
@admin_required
def generate_developer_api():
    """Gera uma nova chave de API externa para bots e automações."""
    admin = Admin.query.get(session['user_id'])
    if not admin:
        return jsonify({'success': False, 'message': 'Admin não encontrado'}), 404

    # Formato seguro: mb_live_ + 40 caracteres hexadecimais aleatórios
    new_key = f"mb_live_{secrets.token_hex(20)}"
    admin.api_key = new_key

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao salvar chave: {str(e)}'}), 500

    return jsonify({
        'success': True,
        'message': 'Chave de API gerada com sucesso!',
        'api_key': new_key,
        'base_url': _get_base_url(),
    })


@developer_api_bp.route('/api/settings/developer-api/revoke', methods=['DELETE'])
@admin_required
def revoke_developer_api():
    """Revoga a chave de API externa."""
    admin = Admin.query.get(session['user_id'])
    if not admin:
        return jsonify({'success': False, 'message': 'Admin não encontrado'}), 404

    admin.api_key = None
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao revogar chave: {str(e)}'}), 500

    return jsonify({
        'success': True,
        'message': 'Chave de API revogada com sucesso!',
    })
