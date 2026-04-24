"""
Telegram Credentials Routes

Endpoints:
  POST /api/telegram/auth/send-code       → Envia SMS com código de verificação
  POST /api/telegram/auth/verify-code     → Troca código por session_string (+ 2FA se ativo)
  GET  /api/telegram/status               → Status da integração (conectado / expirado / canal)
  POST /api/telegram/disconnect           → Remove credenciais
"""
import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps
from models import Admin
from db.integration_helpers import get_integration, set_integration, update_integration_config

logger = logging.getLogger("routes.telegram.credentials")

telegram_credentials_bp = Blueprint('telegram_credentials', __name__)


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


def _get_telegram_config() -> dict:
    _, config = get_integration('telegram')
    return config


def _mark_session_invalid():
    """Marca a session como inválida no banco para forçar reautenticação."""
    _, config = get_integration('telegram')
    config.pop('session_string', None)
    config['session_error'] = 'Sessão revogada ou expirada. Reconecte o Telegram.'
    set_integration('telegram', False, config)


# ─── Status ───────────────────────────────────────────────────────────

@telegram_credentials_bp.route('/status', methods=['GET'])
@admin_required
def get_status():
    """
    Retorna o status atual da integração Telegram.

    session_status pode ser:
      - 'connected'  → session_string válida e canal configurado
      - 'no_channel' → autenticado mas sem canal criado
      - 'expired'    → session foi revogada pelo Telegram
      - 'disconnected' → não configurado
    """
    enabled, config = get_integration('telegram')
    has_session = bool(config.get('session_string'))
    has_error = bool(config.get('session_error'))

    if has_session and config.get('canal_id'):
        status = 'connected'
    elif has_session:
        status = 'no_channel'
    elif has_error:
        status = 'expired'
    else:
        status = 'disconnected'

    return jsonify({
        'enabled': enabled,
        'connected': has_session,
        'session_status': status,
        'session_error': config.get('session_error', ''),
        'api_id': config.get('api_id', ''),
        'canal_id': str(config.get('canal_id', '')),
        'canal_nome': config.get('canal_nome', ''),
        'phone': config.get('phone', ''),
    })


# ─── Enviar código SMS ─────────────────────────────────────────────

@telegram_credentials_bp.route('/auth/send-code', methods=['POST'])
@admin_required
def send_code():
    """Envia código de verificação SMS para o número informado."""
    data = request.json or {}
    api_id = data.get('api_id', '').strip()
    api_hash = data.get('api_hash', '').strip()
    phone = data.get('phone', '').strip()

    if not api_id or not api_hash or not phone:
        return jsonify({'success': False, 'message': 'api_id, api_hash e phone são obrigatórios'}), 400

    try:
        api_id_int = int(api_id)
    except ValueError:
        return jsonify({'success': False, 'message': 'api_id deve ser numérico'}), 400

    try:
        from integrations.telegram.service import send_code as tg_send_code
        result = tg_send_code(api_id_int, api_hash, phone)

        # Salva dados temporários para uso no verify-code
        update_integration_config('telegram', {
            'api_id': api_id,
            'api_hash': api_hash,
            'phone': phone,
            '_phone_code_hash': result['phone_code_hash'],
            'session_error': '',
        })

        return jsonify({'success': True, 'message': f'Código enviado para {phone}.'})

    except Exception as e:
        logger.error(f"send_code error: {e}")
        return jsonify({'success': False, 'message': f'Erro ao enviar código: {str(e)}'}), 500


# ─── Verificar código / obter session_string ──────────────────────

@telegram_credentials_bp.route('/auth/verify-code', methods=['POST'])
@admin_required
def verify_code_route():
    """
    Verifica o código SMS e gera a session_string persistente.
    Se a conta tiver 2FA ativa e cloud_password não for fornecida,
    retorna needs_2fa=True para o frontend pedir a senha.
    """
    data = request.json or {}
    code = data.get('code', '').strip()
    cloud_password = data.get('cloud_password', '').strip() or None

    if not code:
        return jsonify({'success': False, 'message': 'Código é obrigatório'}), 400

    config = _get_telegram_config()
    api_id = config.get('api_id')
    api_hash = config.get('api_hash')
    phone = config.get('phone')
    phone_code_hash = config.get('_phone_code_hash')

    if not all([api_id, api_hash, phone, phone_code_hash]):
        return jsonify({'success': False, 'message': 'Inicie o processo enviando o código primeiro.'}), 400

    try:
        from integrations.telegram.service import verify_code, Telegram2FARequired

        session_string = verify_code(
            api_id=int(api_id),
            api_hash=api_hash,
            phone=phone,
            code=code,
            phone_code_hash=phone_code_hash,
            cloud_password=cloud_password,
        )

        # Salva session_string e limpa dados temporários
        config['session_string'] = session_string
        config.pop('_phone_code_hash', None)
        config['session_error'] = ''
        set_integration('telegram', True, config)

        return jsonify({'success': True, 'message': 'Telegram conectado com sucesso!'})

    except Telegram2FARequired as e:
        return jsonify({
            'success': False,
            'needs_2fa': True,
            'message': str(e),
        }), 200  # 200 para o frontend tratar normalmente

    except Exception as e:
        logger.error(f"verify_code error: {e}")
        return jsonify({'success': False, 'message': f'Erro ao verificar código: {str(e)}'}), 500


# ─── Desconectar ──────────────────────────────────────────────────

@telegram_credentials_bp.route('/disconnect', methods=['POST'])
@admin_required
def disconnect():
    """Remove a session_string e o canal, desconectando o Telegram."""
    _, config = get_integration('telegram')
    config.pop('session_string', None)
    config.pop('canal_id', None)
    config.pop('canal_nome', None)
    config.pop('_phone_code_hash', None)
    config['session_error'] = ''
    set_integration('telegram', False, config)
    return jsonify({'success': True, 'message': 'Telegram desconectado.'})
