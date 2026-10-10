"""Decorators de autorização compartilhados por todas as rotas."""
from functools import wraps
from flask import jsonify, session
from models import Admin


def _unauthorized():
    return jsonify({
        'success': False,
        'error': 'Unauthorized',
        'message': 'Não autorizado',
    }), 401


def admin_required(f):
    """Exige sessão de admin (user_type == 'admin') e admin existente no banco.

    O ID da sessão sozinho não basta: alunos e admins têm tabelas separadas
    e IDs podem coincidir.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('user_id') is None or session.get('user_type') != 'admin':
            return _unauthorized()
        if not Admin.query.get(session['user_id']):
            return _unauthorized()
        return f(*args, **kwargs)
    return decorated_function
