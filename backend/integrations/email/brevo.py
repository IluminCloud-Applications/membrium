"""
Cliente Brevo para envio de emails transacionais.

Responsável por enviar emails via API da Brevo,
usando os templates e configurações do usuário.
"""
import requests
import json
import logging
from integrations.utils.template import replace_template_variables, text_to_html

logger = logging.getLogger(__name__)


class BrevoClient:
    """Cliente para API da Brevo (envio de email)."""

    API_URL = "https://api.brevo.com/v3/smtp/email"

    def __init__(self, settings_dict: dict):
        self.settings = settings_dict

    def is_configured(self) -> bool:
        """Verifica se a Brevo está configurada e habilitada."""
        return bool(
            self.settings.get('brevo_enabled')
            and self.settings.get('brevo_api_key')
        )

    def send_email(self, student_data: dict) -> tuple[bool, str]:
        """
        Envia email de cadastro para o aluno usando o template configurado.

        Args:
            student_data: Dicionário com dados do aluno (name, email, password, etc.)

        Returns:
            Tupla (success, message)
        """
        if not self.is_configured():
            return False, "Brevo não está configurada ou habilitada"

        template = self.settings.get('brevo_email_template')
        if not template:
            return False, "Template de email não configurado"

        subject = self.settings.get('brevo_email_subject', 'Bem-vindo ao seu curso')
        template_mode = self.settings.get('brevo_template_mode', 'simple')

        return self._build_and_send(template, subject, template_mode, student_data)

    def send_forgot_password_email(self, student_data: dict) -> tuple[bool, str]:
        """
        Envia email de recuperação de senha usando o template de forgot password.

        Args:
            student_data: Dicionário com dados do aluno + recovery_link

        Returns:
            Tupla (success, message)
        """
        if not self.is_configured():
            return False, "Brevo não está configurada ou habilitada"

        template = self.settings.get('brevo_forgot_email_template')
        if not template:
            return False, "Template de email de recuperação não configurado"

        subject = self.settings.get('brevo_forgot_email_subject', 'Recuperação de senha')
        template_mode = self.settings.get('brevo_forgot_template_mode', 'simple')

        return self._build_and_send(template, subject, template_mode, student_data)

    def _build_and_send(
        self,
        template: str,
        subject: str,
        template_mode: str,
        student_data: dict,
    ) -> tuple[bool, str]:
        """Monta o HTML do email e envia via API."""
        sender_name = self.settings.get('sender_name') or 'Suporte'
        sender_email = self.settings.get('sender_email') or self.settings.get('support_email')

        if not sender_email:
            return False, "Email do remetente não configurado"

        subject = replace_template_variables(subject, student_data)

        if template_mode == 'html':
            html_content = replace_template_variables(template, student_data)
        else:
            html_content = text_to_html(template, student_data)

        return self._send_request(
            sender_name=sender_name,
            sender_email=sender_email,
            to_name=student_data.get('name', ''),
            to_email=student_data['email'],
            subject=subject,
            html_content=html_content,
        )

    def _send_request(
        self,
        sender_name: str,
        sender_email: str,
        to_name: str,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> tuple[bool, str]:
        """Faz a requisição HTTP para a API da Brevo."""
        try:
            payload = {
                'sender': {'name': sender_name, 'email': sender_email},
                'to': [{'email': to_email, 'name': to_name}],
                'subject': subject,
                'htmlContent': html_content,
            }

            headers = {
                'accept': 'application/json',
                'api-key': self.settings['brevo_api_key'],
                'content-type': 'application/json',
            }

            print(f"[Brevo] Enviando email para {to_email}")
            print(f"[Brevo] Sender: {sender_email}, API Key: ***{self.settings['brevo_api_key'][-4:] if self.settings.get('brevo_api_key') else 'NONE'}")
            response = requests.post(self.API_URL, headers=headers, json=payload, timeout=15)

            if 200 <= response.status_code < 300:
                print("[Brevo] Email enviado com sucesso!")
                return True, "Email enviado com sucesso"

            error_msg = f"Erro Brevo: status {response.status_code}"
            try:
                error_data = response.json()
                error_msg = f"Erro Brevo: {error_data.get('message', response.status_code)}"
                print(f"[Brevo] ERRO response: {error_data}")
            except Exception:
                print(f"[Brevo] ERRO raw: {response.text}")

            print(error_msg)
            return False, error_msg

        except requests.exceptions.ConnectionError:
            logger.error("Erro de conexão com API da Brevo")
            return False, "Erro de conexão com a Brevo"
        except requests.exceptions.Timeout:
            logger.error("Timeout ao conectar com API da Brevo")
            return False, "Timeout ao enviar email"
        except Exception as e:
            logger.error(f"Erro ao enviar email via Brevo: {str(e)}")
            return False, f"Erro: {str(e)}"


def send_brevo_email(settings_dict: dict, student_data: dict) -> tuple[bool, str]:
    """Wrapper para envio de email de cadastro via Brevo."""
    client = BrevoClient(settings_dict)
    return client.send_email(student_data)


def send_brevo_forgot_email(settings_dict: dict, student_data: dict) -> tuple[bool, str]:
    """Wrapper para envio de email de recuperação de senha via Brevo."""
    client = BrevoClient(settings_dict)
    return client.send_forgot_password_email(student_data)
