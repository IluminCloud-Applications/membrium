"""
Chatwoot Sync — Sincronização assíncrona de mensagens do Chatbot para o Chatwoot.

Fluxo por aluno (única thread sequencial por mensagem):
  1. Buscar / criar Contato no Chatwoot (cache em student.extra_data)
  2. Buscar / criar Conversa no Chatwoot  (cache em student.extra_data)
  3. Enviar mensagem (incoming = aluno, outgoing = IA)
"""

import logging
import threading
import requests as http_requests
from flask import current_app
from db.database import db
from db.integration_helpers import get_integration
from models import Student

logger = logging.getLogger("routes.chatbot.chatwoot_sync")


# ─── Public helpers chamados por chat.py ─────────────────────────────

def sync_user_and_ai_messages(student_id: int, user_message: str, ai_response: str):
    """
    Envia user_message (incoming) e ai_response (outgoing) sequencialmente
    em background, sem bloquear a resposta da rota de chat.
    """
    if not student_id or student_id < 0:
        return  # Ignorar testes do admin (ID negativo)

    app = current_app._get_current_object()

    def task():
        with app.app_context():
            _send_pair(student_id, user_message, ai_response)

    t = threading.Thread(target=task, daemon=True)
    t.start()


# ─── Lógica interna ──────────────────────────────────────────────────

def _send_pair(student_id: int, user_message: str, ai_response: str):
    """Envia os dois lados da conversa de forma sequencial e segura."""
    chatwoot_enabled, config = get_integration('chatwoot')
    if not chatwoot_enabled:
        return

    account_id = config.get('account_id', '').strip()
    inbox_id   = config.get('inbox_id', '').strip()
    api_key    = config.get('api_key', '').strip()
    base_url   = config.get('base_url', 'https://app.chatwoot.com').rstrip('/')

    if not all([account_id, inbox_id, api_key, base_url]):
        logger.warning("Chatwoot: configuração incompleta, sincronização ignorada.")
        return

    student = Student.query.get(student_id)
    if not student:
        return

    headers = {
        'api_access_token': api_key,
        'Content-Type': 'application/json',
    }
    api_root = f"{base_url}/api/v1/accounts/{account_id}"

    # Trabalhar com uma cópia do extra_data para evitar conflitos de referência
    extra_data = dict(student.extra_data or {})

    # Passo 1: Obter / Criar Contato
    contact_id = extra_data.get('chatwoot_contact_id')
    if not contact_id:
        contact_id = _get_or_create_contact(api_root, headers, inbox_id, student)
        if contact_id:
            extra_data['chatwoot_contact_id'] = contact_id
            student.extra_data = extra_data
            db.session.commit()

    if not contact_id:
        logger.error("Chatwoot: não foi possível obter/criar contato.")
        return

    # Passo 2: Obter / Criar Conversa
    conversation_id = extra_data.get('chatwoot_conversation_id')
    if not conversation_id:
        conversation_id = _create_conversation(api_root, headers, inbox_id, contact_id)
        if conversation_id:
            extra_data['chatwoot_conversation_id'] = conversation_id
            student.extra_data = extra_data
            db.session.commit()

    if not conversation_id:
        logger.error("Chatwoot: não foi possível obter/criar conversa.")
        return

    # Passo 3a: Mensagem do aluno (incoming)
    _send_message(api_root, headers, conversation_id, user_message, "incoming")

    # Passo 3b: Resposta da IA (outgoing)
    if ai_response:
        _send_message(api_root, headers, conversation_id, ai_response, "outgoing")


def _get_or_create_contact(api_root, headers, inbox_id, student) -> int | None:
    """Busca contato por email ou cria um novo. Retorna o contact_id."""
    try:
        resp = http_requests.get(
            f"{api_root}/contacts/search",
            params={'q': student.email, 'include_contacts': 'true'},
            headers=headers,
            timeout=10,
        )
        if resp.status_code == 200:
            payload = resp.json().get('payload', [])
            if payload and isinstance(payload, list):
                return payload[0].get('id')

        # Não encontrou: criar
        body = {"inbox_id": int(inbox_id), "name": student.name, "email": student.email}
        resp = http_requests.post(f"{api_root}/contacts", json=body, headers=headers, timeout=10)

        if resp.status_code not in (200, 201):
            logger.error(f"Chatwoot: criar contato falhou [{resp.status_code}] {resp.text}")
            return None

        data = resp.json()
        # Chatwoot pode retornar {id:…} ou {payload:{contact:{id:…}}}
        return (
            data.get('id')
            or data.get('payload', {}).get('contact', {}).get('id')
            or (data.get('payload', [{}])[0].get('id') if isinstance(data.get('payload'), list) else None)
        )

    except Exception as e:
        logger.error(f"Chatwoot: erro ao obter/criar contato — {e}")
        return None


def _create_conversation(api_root, headers, inbox_id, contact_id) -> int | None:
    """Cria uma nova conversa vinculada ao contato. Retorna o conversation_id."""
    try:
        body = {"inbox_id": int(inbox_id), "contact_id": contact_id, "status": "open"}
        resp = http_requests.post(f"{api_root}/conversations", json=body, headers=headers, timeout=10)

        if resp.status_code not in (200, 201):
            logger.error(f"Chatwoot: criar conversa falhou [{resp.status_code}] {resp.text}")
            return None

        data = resp.json()
        return data.get('id') or data.get('payload', {}).get('id')

    except Exception as e:
        logger.error(f"Chatwoot: erro ao criar conversa — {e}")
        return None


def _send_message(api_root, headers, conversation_id, content, message_type):
    """
    Envia uma mensagem para a conversa.

    Chatwoot Application API usa valores numéricos internamente:
      0 = incoming (mensagem do cliente)
      1 = outgoing (mensagem do agente/IA)

    A string "incoming" é aceita mas pode não ser renderizada corretamente
    na UI. Usamos os valores numéricos para garantir o comportamento correto.
    """
    # Chatwoot: "outgoing" string → direita (agente/IA) | 0 int → esquerda (cliente)
    # O número 1 para outgoing renderiza incorretamente no lado do cliente.
    # "incoming" como string retorna 422 em inboxes não-API, por isso usamos 0.
    type_map = {"incoming": 0, "outgoing": "outgoing"}
    message_type_val = type_map.get(message_type, "outgoing")

    try:
        body = {
            "content": content,
            "message_type": message_type_val,
            "content_type": "text",
        }
        resp = http_requests.post(
            f"{api_root}/conversations/{conversation_id}/messages",
            json=body,
            headers=headers,
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            logger.error(
                f"Chatwoot: enviar mensagem ({message_type}/{message_type_val}) falhou "
                f"[{resp.status_code}] {resp.text}"
            )
        else:
            msg_id = resp.json().get('id', '?')
            logger.info(
                f"Chatwoot: mensagem '{message_type}' (val={message_type_val}) "
                f"enviada → id={msg_id} (conv {conversation_id})"
            )
    except Exception as e:
        logger.error(f"Chatwoot: erro ao enviar mensagem ({message_type}) — {e}")
