"""
Validação de autenticidade dos webhooks.

A URL do webhook (/webhook/<plataforma>/<uuid>) sozinha não é um segredo
confiável: ela aparece em painéis, logs e prints. Aqui cada plataforma é
conferida com o mecanismo que ela oferece:

- Hotmart: header `X-Hotmart-Hottok` igual ao token configurado.
- Kiwify:  query `?signature=` = HMAC-SHA1(corpo bruto, token) em hex.

Os segredos ficam na integração `webhook_security` (chaves `hotmart_hottok`,
`kiwify_token`) ou, como fallback, nas variáveis de ambiente
`WEBHOOK_SECRET_HOTMART` e `WEBHOOK_SECRET_KIWIFY`.

Plataformas sem verificador aqui continuam aceitas, mas geram aviso no log.
"""
import hashlib
import hmac
import logging
import os

from flask import request

from db.integration_helpers import get_integration

logger = logging.getLogger(__name__)

# plataforma -> (chave na integração, variável de ambiente)
_SECRET_SOURCES = {
    'hotmart': ('hotmart_hottok', 'WEBHOOK_SECRET_HOTMART'),
    'kiwify': ('kiwify_token', 'WEBHOOK_SECRET_KIWIFY'),
}


def get_webhook_secret(platform: str) -> str:
    source = _SECRET_SOURCES.get(platform)
    if not source:
        return ''
    config_key, env_key = source
    _, config = get_integration('webhook_security')
    return (config.get(config_key) or os.environ.get(env_key) or '').strip()


def _verify_hotmart(secret: str) -> bool:
    received = request.headers.get('X-Hotmart-Hottok', '')
    return hmac.compare_digest(received, secret)


def _verify_kiwify(secret: str) -> bool:
    received = (request.args.get('signature') or '').strip().lower()
    expected = hmac.new(
        secret.encode('utf-8'), request.get_data(), hashlib.sha1
    ).hexdigest()
    return hmac.compare_digest(received, expected)


_VERIFIERS = {
    'hotmart': _verify_hotmart,
    'kiwify': _verify_kiwify,
}


def verify_webhook(platform: str) -> tuple[bool, str]:
    """Retorna (ok, motivo). Falha fechada nas plataformas com verificador."""
    verifier = _VERIFIERS.get(platform)
    if not verifier:
        logger.warning(
            "[Webhook] %s sem verificação de assinatura — qualquer um com a URL pode chamar.",
            platform,
        )
        return True, ''

    secret = get_webhook_secret(platform)
    if not secret:
        logger.error("[Webhook] %s: segredo não configurado, requisição recusada.", platform)
        return False, 'Segredo do webhook não configurado'

    if not verifier(secret):
        logger.warning("[Webhook] %s: assinatura inválida, requisição recusada.", platform)
        return False, 'Assinatura inválida'

    return True, ''
