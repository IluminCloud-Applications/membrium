"""
Telegram Channel Routes

Endpoints:
  POST /api/telegram/channel/create   → Cria o canal privado de armazenamento
"""
import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps
from models import Admin
from db.integration_helpers import get_integration, update_integration_config

logger = logging.getLogger("routes.telegram.channel")

telegram_channel_bp = Blueprint('telegram_channel', __name__)


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


def _get_tg_creds() -> tuple[dict | None, str | None]:
    """Retorna (config, error_message) com as credenciais do Telegram."""
    _, config = get_integration('telegram')
    if not config.get('session_string'):
        return None, "Telegram não está autenticado. Configure as credenciais primeiro."
    return config, None


# ─── Criar canal ──────────────────────────────────────────────────

@telegram_channel_bp.route('/channel/create', methods=['POST'])
@admin_required
def create_channel():
    """
    Cria um canal privado no Telegram para armazenamento de vídeos.
    Deve ser executado apenas uma vez por conta.
    """
    config, error = _get_tg_creds()
    if error:
        return jsonify({'success': False, 'message': error}), 400

    data = request.json or {}
    title = data.get('title', 'Membrium Vídeos').strip()
    description = data.get('description', 'Canal privado de armazenamento de vídeos de aulas.').strip()

    try:
        from integrations.telegram.service import create_channel
        result = create_channel(
            api_id=int(config['api_id']),
            api_hash=config['api_hash'],
            session_string=config['session_string'],
            title=title,
            description=description,
        )

        # Persiste o canal na integração
        update_integration_config('telegram', {
            'canal_id': result['canal_id'],
            'canal_nome': result['canal_nome'],
        })

        return jsonify({
            'success': True,
            'canal_id': result['canal_id'],
            'canal_nome': result['canal_nome'],
            'invite_link': result['invite_link'],
            'message': f'Canal "{result["canal_nome"]}" criado com sucesso!',
        }), 201

    except Exception as e:
        logger.error(f"create_channel error: {e}")
        return jsonify({'success': False, 'message': f'Erro ao criar canal: {str(e)}'}), 500
