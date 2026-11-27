"""
Integrations - Dispatcher central de notificações.

Responsável por verificar quais integrações estão habilitadas
e disparar as notificações (email/whatsapp) de forma unificada.
"""
from .dispatcher import dispatch_notifications, dispatch_notifications_async

__all__ = ['dispatch_notifications', 'dispatch_notifications_async']
