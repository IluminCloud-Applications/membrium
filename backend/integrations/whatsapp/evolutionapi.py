"""
Cliente Evolution API para envio de mensagens WhatsApp.

Suporta ambas as versões: v1.8.x e v2.x.x.
"""
import requests
import json
import logging
from integrations.utils.template import replace_template_variables

logger = logging.getLogger(__name__)


class EvolutionClient:
    """Cliente para envio de mensagens via Evolution API."""

    def __init__(self, settings_dict: dict):
        self.settings = settings_dict

    def is_configured(self) -> bool:
        """Verifica se a Evolution API está configurada e habilitada."""
        return bool(
            self.settings.get('evolution_enabled')
            and self.settings.get('evolution_url')
            and self.settings.get('evolution_api_key')
            and self.settings.get('evolution_instance')
            and self.settings.get('evolution_version')
        )

    def send_message(self, phone_number: str, student_data: dict) -> tuple[bool, str]:
        """
        Envia mensagem WhatsApp para o aluno.

        Args:
            phone_number: Número do aluno (formato brasileiro)
            student_data: Dados do aluno para substituição no template

        Returns:
            Tupla (success, message)
        """
        if not self.is_configured():
            return False, "Evolution API não está configurada"

        # Log detalhado para debug
        print(f"[Evolution] Settings: url={self.settings.get('evolution_url')}, "
              f"version={self.settings.get('evolution_version')}, "
              f"instance={self.settings.get('evolution_instance')}, "
              f"api_key=***{self.settings.get('evolution_api_key', '')[-4:] if self.settings.get('evolution_api_key') else 'NONE'}")

        # Validar e formatar telefone
        normalized = self._normalize_phone(phone_number)
        if not normalized:
            return False, f"Número de telefone inválido: {phone_number}"

        formatted = self._format_whatsapp_phone(phone_number)
        phone = formatted['whatsapp_formatado']

        # Substituir variáveis no template
        template = self.settings.get('evolution_message_template', '')
        message = replace_template_variables(template, student_data)

        if not message.strip():
            return False, "Mensagem vazia após substituição do template"

        # Enviar pela versão correta
        version = self.settings.get('evolution_version', '2.x.x')
        if version == '1.8.x':
            return self._send_v1(phone, message)
        return self._send_v2(phone, message)

    # ─── Formatação de telefone ──────────────────────────────────

    def _normalize_phone(self, phone: str) -> str | None:
        """Remove caracteres não-numéricos e valida comprimento mínimo."""
        digits = ''.join(filter(str.isdigit, phone))
        if len(digits) < 10:
            logger.error(f"Telefone muito curto: {digits}")
            return None
        return digits

    def _format_whatsapp_phone(self, phone_input: str) -> dict:
        """Formata telefone brasileiro para formato do WhatsApp."""
        cleaned = phone_input.replace(" ", "").replace("(", "").replace(")", "").replace("-", "")
        length = len(cleaned)
        ddx = cleaned[:2]

        if length >= 12:
            if cleaned[0] == '+':
                number = str(int(cleaned[3:]))
            elif ddx == '55':
                number = str(int(cleaned[2:]))
            else:
                number = str(int(cleaned))
        else:
            number = str(int(cleaned))

        # Extrair DDD
        ddd = number[:2] if len(number) >= 2 else ""
        rest = number[2:] if len(number) >= 2 else number

        try:
            if int(ddd) > 28:
                phone_formatted = rest[-8:]
            else:
                phone_formatted = "9" + rest[-8:]
        except (ValueError, IndexError):
            phone_formatted = rest[-8:]

        whatsapp = f"+55{ddd}{phone_formatted}"
        return {"ddd": ddd, "phone": phone_formatted, "whatsapp_formatado": whatsapp}

    # ─── Envio por versão ────────────────────────────────────────

    def _send_v1(self, phone: str, message: str) -> tuple[bool, str]:
        """Envio via Evolution API v1.8.x."""
        try:
            url = f"{self.settings['evolution_url']}/message/sendText/{self.settings['evolution_instance']}"
            headers = {
                'Content-Type': 'application/json',
                'apikey': self.settings['evolution_api_key'],
            }
            payload = {
                "number": phone,
                "options": {"delay": 1200, "presence": "composing", "linkPreview": False},
                "textMessage": {"text": message},
            }

            logger.info(f"Enviando WhatsApp v1.8.x para {phone}")
            response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
            return self._parse_response(response, "v1.8.x")

        except requests.exceptions.ConnectionError:
            return False, "Erro de conexão com Evolution API"
        except requests.exceptions.Timeout:
            return False, "Timeout ao enviar WhatsApp"
        except Exception as e:
            logger.error(f"Erro Evolution v1: {str(e)}")
            return False, f"Erro: {str(e)}"

    def _send_v2(self, phone: str, message: str) -> tuple[bool, str]:
        """Envio via Evolution API v2.x.x."""
        try:
            instance = self.settings['evolution_instance']
            url = f"{self.settings['evolution_url']}/message/sendText/{instance}"
            headers = {
                'Content-Type': 'application/json',
                'apikey': self.settings['evolution_api_key'],
            }
            payload = {
                "number": phone,
                "text": message,
                "delay": 1200,
            }

            print(f"[Evolution] Enviando WhatsApp v2.x.x para {phone} | URL: {url}")
            print(f"[Evolution] Payload: {payload}")
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            return self._parse_response(response, "v2.x.x")

        except requests.exceptions.ConnectionError:
            return False, "Erro de conexão com Evolution API"
        except requests.exceptions.Timeout:
            return False, "Timeout ao enviar WhatsApp"
        except Exception as e:
            logger.error(f"Erro Evolution v2: {str(e)}")
            return False, f"Erro: {str(e)}"

    def _parse_response(self, response, version: str) -> tuple[bool, str]:
        """Parse da resposta da API para ambas as versões."""
        if response.status_code in (200, 201):
            print(f"[Evolution] WhatsApp enviado com sucesso via {version}")
            return True, "Mensagem enviada com sucesso"

        try:
            error_info = response.json()
            error_msg = f"Erro Evolution: {error_info.get('message', response.status_code)}"
            print(f"[Evolution] ERRO response ({response.status_code}): {error_info}")
        except Exception:
            error_msg = f"Erro Evolution: status {response.status_code}"
            print(f"[Evolution] ERRO raw ({response.status_code}): {response.text}")

        print(error_msg)
        return False, error_msg


def send_whatsapp_message(settings_dict: dict, phone_number: str, student_data: dict) -> tuple[bool, str]:
    """
    Função wrapper para envio de WhatsApp via Evolution API.

    Args:
        settings_dict: Configurações do sistema
        phone_number: Número do aluno
        student_data: Dados do aluno para o template

    Returns:
        Tupla (success, message)
    """
    if not phone_number:
        return False, "Número de telefone não fornecido"

    client = EvolutionClient(settings_dict)
    return client.send_message(phone_number, student_data)
