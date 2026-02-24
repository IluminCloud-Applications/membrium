"""
YouTube OAuth Routes - Handles OAuth2 flow for YouTube integration.

Endpoints:
- POST /api/youtube/auth-url     → Generate Google OAuth consent URL
- POST /api/youtube/callback     → Exchange auth code for tokens
- GET  /api/youtube/status       → Check connection status
- POST /api/youtube/disconnect   → Disconnect YouTube channel
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from models import Admin
from db.integration_helpers import get_integration, set_integration
import logging

logger = logging.getLogger("routes.youtube.oauth")

youtube_oauth_bp = Blueprint('youtube_oauth', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@youtube_oauth_bp.route('/auth-url', methods=['POST'])
@admin_required
def get_auth_url():
    """Generate the Google OAuth2 consent URL."""
    from integrations.youtube.connection import build_auth_url

    _, youtube = get_integration('youtube')

    if not youtube.get('client_id') or not youtube.get('client_secret'):
        return jsonify({
            'success': False,
            'message': 'Salve o Client ID e Client Secret antes de conectar.',
        }), 400

    data = request.json or {}
    redirect_uri = data.get('redirect_uri', '')

    if not redirect_uri:
        return jsonify({
            'success': False,
            'message': 'redirect_uri é obrigatório.',
        }), 400

    try:
        auth_url = build_auth_url(
            client_id=youtube['client_id'],
            client_secret=youtube['client_secret'],
            redirect_uri=redirect_uri,
        )

        return jsonify({
            'success': True,
            'auth_url': auth_url,
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao gerar URL: {str(e)}',
        }), 500


@youtube_oauth_bp.route('/callback', methods=['POST'])
@admin_required
def handle_callback():
    """Exchange the auth code for tokens and save to IntegrationConfig."""
    from integrations.youtube.connection import exchange_code

    enabled, youtube = get_integration('youtube')

    if not youtube.get('client_id') or not youtube.get('client_secret'):
        return jsonify({
            'success': False,
            'message': 'Credenciais YouTube não configuradas.',
        }), 400

    data = request.json or {}
    code = data.get('code', '')
    redirect_uri = data.get('redirect_uri', '')

    if not code:
        return jsonify({
            'success': False,
            'message': 'Código de autorização ausente.',
        }), 400

    try:
        result = exchange_code(
            client_id=youtube['client_id'],
            client_secret=youtube['client_secret'],
            code=code,
            redirect_uri=redirect_uri,
        )

        youtube['refresh_token'] = result['refresh_token']
        youtube['channel_name'] = result['channel_name']
        youtube['channel_id'] = result['channel_id']
        set_integration('youtube', enabled, youtube)

        return jsonify({
            'success': True,
            'message': f'YouTube conectado: {result["channel_name"]}',
            'channel_name': result['channel_name'],
            'channel_id': result['channel_id'],
        })

    except ValueError as e:
        logger.warning(f"YouTube callback ValueError: {e}")
        return jsonify({
            'success': False,
            'message': str(e),
        }), 400
    except Exception as e:
        logger.error(f"YouTube callback error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Erro ao conectar: {str(e)}',
        }), 500


@youtube_oauth_bp.route('/status', methods=['GET'])
@admin_required
def get_status():
    """Check if YouTube is connected and return channel info."""
    _, youtube = get_integration('youtube')

    connected = bool(
        youtube.get('client_id')
        and youtube.get('client_secret')
        and youtube.get('refresh_token')
    )

    return jsonify({
        'connected': connected,
        'channel_name': youtube.get('channel_name', ''),
        'channel_id': youtube.get('channel_id', ''),
    })


@youtube_oauth_bp.route('/disconnect', methods=['POST'])
@admin_required
def disconnect():
    """Disconnect the YouTube channel by removing refresh token."""
    enabled, youtube = get_integration('youtube')

    youtube['refresh_token'] = None
    youtube['channel_name'] = None
    youtube['channel_id'] = None
    set_integration('youtube', enabled, youtube)

    return jsonify({
        'success': True,
        'message': 'YouTube desconectado com sucesso.',
    })
