"""Authentication decorator for external API requests (via X-API-Key or Bearer token)."""
from functools import wraps
from flask import request, jsonify, g
from models import Admin


def external_api_key_required(f):
    """
    Decorator que autentica requisições externas via chave de API.
    Aceita:
      - Header 'X-API-Key: mb_live_...'
      - Header 'Authorization: Bearer mb_live_...'
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = None

        # 1. Tentar X-API-Key
        if 'X-API-Key' in request.headers:
            api_key = request.headers.get('X-API-Key', '').strip()

        # 2. Tentar Authorization Bearer
        if not api_key and 'Authorization' in request.headers:
            auth_header = request.headers.get('Authorization', '').strip()
            if auth_header.lower().startswith('bearer '):
                api_key = auth_header[7:].strip()
            else:
                api_key = auth_header

        if not api_key:
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': 'Chave de API não informada. Envie via header X-API-Key ou Authorization: Bearer <sua_chave>.'
            }), 401

        # Busca admin que possui essa chave
        admin = Admin.query.filter_by(api_key=api_key).first()
        if not admin:
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': 'Chave de API inválida ou revogada.'
            }), 401

        g.current_admin = admin
        return f(*args, **kwargs)

    return decorated_function
