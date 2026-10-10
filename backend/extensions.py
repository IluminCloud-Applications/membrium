"""Extensões Flask compartilhadas (instanciadas aqui para evitar import circular)."""
import os
from flask import request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def email_key():
    """Chave de limite por e-mail informado no corpo JSON (cai para o IP)."""
    data = request.get_json(silent=True) or {}
    email = str(data.get('email') or '').strip().lower()
    return f"email:{email}" if email else get_remote_address()


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get('REDIS_URL', 'memory://'),
    storage_options={'socket_connect_timeout': 2},
    in_memory_fallback_enabled=True,  # se o Redis cair, não derruba o login
    default_limits=[],
)
