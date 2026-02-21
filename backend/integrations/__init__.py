"""
Integrations - Dispatcher central de notificações.

Responsável por verificar quais integrações estão habilitadas
e disparar as notificações (email/whatsapp) de forma unificada.
"""
from .dispatcher import dispatch_notifications

__all__ = ['dispatch_notifications']
