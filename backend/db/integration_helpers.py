"""
Helpers centralizados para IntegrationConfig.

Funções principais:
- get_integration(provider)  → (enabled, config_dict)
- set_integration(provider, enabled, config) → IntegrationConfig row
- get_ai_api_key(provider)   → str | None
"""
from models import IntegrationConfig
from db.database import db


def get_integration(provider: str) -> tuple[bool, dict]:
    """Retorna (enabled, config) de uma integração.
    
    Se o provider não existir, retorna (False, {}).
    """
    row = IntegrationConfig.query.filter_by(provider=provider).first()
    if not row:
        return False, {}
    return row.enabled, dict(row.config or {})


def set_integration(provider: str, enabled: bool, config: dict) -> IntegrationConfig:
    """Cria ou atualiza uma integração.
    
    Args:
        provider: Nome do provider (ex: 'brevo', 'youtube')
        enabled: Se está habilitado
        config: Dict com as configurações específicas do provider
    
    Returns:
        A row de IntegrationConfig atualizada (já commitada)
    """
    row = IntegrationConfig.query.filter_by(provider=provider).first()
    if not row:
        row = IntegrationConfig(provider=provider)
        db.session.add(row)

    row.enabled = enabled
    row.config = config
    db.session.commit()
    return row


def update_integration_config(provider: str, partial_config: dict) -> IntegrationConfig:
    """Atualiza parcialmente o config de uma integração (merge).
    
    Útil quando você quer atualizar apenas alguns campos do config
    sem sobrescrever os outros.
    """
    row = IntegrationConfig.query.filter_by(provider=provider).first()
    if not row:
        row = IntegrationConfig(provider=provider, enabled=False, config={})
        db.session.add(row)

    current = dict(row.config or {})
    current.update(partial_config)
    row.config = current
    db.session.commit()
    return row


def get_ai_api_key(provider: str) -> str | None:
    """Retorna a API key do provider de IA configurado.
    
    Args:
        provider: 'gemini' ou 'openai'
    """
    enabled, config = get_integration(provider)
    if not enabled:
        return None
    return config.get('api_key')
