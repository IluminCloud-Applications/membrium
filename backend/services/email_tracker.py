import re
import logging
from datetime import datetime, timedelta
from db.database import db
from models import StudentEmailAccessTracker, Student
from integrations.email.brevo import BrevoClient, send_brevo_email
from db.integration_helpers import get_integration

logger = logging.getLogger(__name__)


def format_whatsapp_link(raw_number: str | None) -> tuple[str, str]:
    """
    Formata o número de WhatsApp para link wa.me/{numero}.
    Garante que se não tiver o DDI 55 (Brasil), adiciona o 55 antes do número.
    Retorna (link_completo, numero_formatado).
    """
    if not raw_number:
        return "", ""

    digits = re.sub(r'\D', '', str(raw_number).strip())
    if not digits:
        return "", ""

    if not digits.startswith('55'):
        digits = f"55{digits}"

    return f"https://wa.me/{digits}", digits


def send_spam_fallback_email(
    settings_dict: dict,
    student_data: dict,
    base_url: str,
    support_email: str,
    support_whatsapp: str,
    tracking_token: str,
) -> tuple[bool, str]:
    """
    Envia email mais simples avisando que o email de acesso pode ter caído em SPAM/Lixo eletrônico,
    fornecendo dados de acesso e canais de suporte (email e WhatsApp wa.me/55...).
    """
    client = BrevoClient(settings_dict)
    if not client.is_configured():
        return False, "Brevo não está configurada"

    name = student_data.get('name') or student_data.get('first_name') or 'Aluno(a)'
    first_name = student_data.get('first_name') or name.split()[0]
    email = student_data.get('email', '')
    password = student_data.get('password', '')
    login_link = student_data.get('link') or f"{base_url}/login"
    fast_link = student_data.get('fast_link')
    curso = student_data.get('curso') or 'seu curso'

    sender_name = settings_dict.get('sender_name') or 'Suporte'
    wa_link, clean_wa = format_whatsapp_link(support_whatsapp)

    # Assunto direto e anti-spam
    subject = f"Aviso importante: Seu acesso ao {curso} pode estar no Spam"

    # Montar bloco de canais de suporte
    support_rows = []
    if wa_link:
        support_rows.append(
            f'<div style="margin: 12px 0;">'
            f'  <a href="{wa_link}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 14px;">'
            f'    📲 Falar conosco no WhatsApp'
            f'  </a>'
            f'  <div style="font-size: 12px; color: #666666; margin-top: 4px;">Link direto: <a href="{wa_link}" style="color: #25D366;">{wa_link}</a></div>'
            f'</div>'
        )
    if support_email:
        support_rows.append(
            f'<div style="margin: 8px 0; font-size: 14px; color: #333333;">'
            f'  ✉️ <strong>Email de suporte:</strong> <a href="mailto:{support_email}" style="color: #0066cc;">{support_email}</a>'
            f'</div>'
        )

    support_html = ""
    if support_rows:
        support_html = (
            f'<div style="background-color: #f0f7ff; border: 1px solid #cce5ff; border-radius: 8px; padding: 16px; margin: 24px 0;">'
            f'  <h4 style="margin: 0 0 10px 0; color: #004085; font-size: 15px;">Precisa de ajuda ou não encontrou o acesso?</h4>'
            f'  <p style="margin: 0 0 12px 0; font-size: 13px; color: #444444;">Fale diretamente com nossa equipe de suporte:</p>'
            f'  {"".join(support_rows)}'
            f'</div>'
        )

    # Pixel de rastreamento para saber se este e-mail foi aberto
    tracking_pixel_tag = ""
    if base_url and tracking_token:
        tracking_pixel_url = f"{base_url}/api/track/email-open/{tracking_token}"
        tracking_pixel_tag = f'<img src="{tracking_pixel_url}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;opacity:0;" alt="" />'

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{subject}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px; color: #333333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 28px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Olá, {first_name}!</h2>
    
    <p style="font-size: 15px; margin-bottom: 16px;">
      Enviamos anteriormente os dados de acesso ao seu treinamento (<strong>{curso}</strong>), mas percebemos que você ainda não abriu o e-mail de acesso.
    </p>

    <div style="background-color: #fff8e6; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #b45309; font-size: 14px;">⚠️ Verifique sua caixa de SPAM ou Lixo Eletrônico:</strong>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #78350f;">
        É comum que provedores como Gmail, Hotmail ou Yahoo direcionem o primeiro e-mail para a pasta de <strong>Spam</strong>, <strong>Lixo Eletrônico</strong> ou <strong>Promoções</strong>. Por favor, procure por e-mails de <strong>{sender_name}</strong>.
      </p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <h3 style="margin-top: 0; font-size: 15px; color: #1e293b;">Seus dados de acesso direto:</h3>
      <p style="margin: 8px 0; font-size: 14px;"><strong>Link de login:</strong> <a href="{login_link}" style="color: #2563eb; word-break: break-all;">{login_link}</a></p>
      {f'<p style="margin: 8px 0; font-size: 14px;"><strong>Acesso rápido (1 clique):</strong> <a href="{fast_link}" style="color: #2563eb; word-break: break-all;">{fast_link}</a></p>' if fast_link else ''}
      <p style="margin: 8px 0; font-size: 14px;"><strong>E-mail:</strong> {email}</p>
      <p style="margin: 8px 0; font-size: 14px;"><strong>Senha:</strong> {password}</p>
    </div>

    {support_html}

    <p style="color: #64748b; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Este aviso automático é enviado para garantir que você não perca seu acesso ao conteúdo. Caso já tenha acessado, por favor desconsidere.
    </p>
    {tracking_pixel_tag}
  </div>
</body>
</html>"""

    return client.send_raw_email(
        to_email=email,
        to_name=name,
        subject=subject,
        html_content=html_content
    )


def process_email_tracking_queue(app):
    """
    Executado periodicamente pelo scheduler em background.
    Verifica se o aluno abriu o e-mail de acesso ou acessou a plataforma.
    - Se não abriu em 30 min: reenvia o acesso (etapa 2).
    - Se não abriu em mais 30 min (60 min total): envia mensagem de aviso de SPAM com WhatsApp/suporte (etapa 3).
    """
    with app.app_context():
        try:
            now = datetime.utcnow()

            # Buscar trackers pendentes cujo prazo de checagem venceu
            pending_trackers = StudentEmailAccessTracker.query.filter(
                StudentEmailAccessTracker.status == 'pending',
                StudentEmailAccessTracker.next_check_at <= now
            ).all()

            if not pending_trackers:
                return

            from routes.students.resend_access import _get_settings_dict
            settings_dict = _get_settings_dict()

            if not settings_dict.get('brevo_enabled') or not settings_dict.get('brevo_api_key'):
                return

            _, support = get_integration('support')
            support_email = support.get('email', '') or settings_dict.get('support_email', '')
            support_whatsapp = support.get('whatsapp', '')

            for tracker in pending_trackers:
                # 1. Verificar se o aluno já abriu o e-mail pelo pixel OU se já logou na plataforma
                student = Student.query.filter_by(email=tracker.email).first()
                has_accessed = False
                if student and student.extra_data:
                    last_access_str = student.extra_data.get('last_access_at')
                    if last_access_str:
                        try:
                            last_access_dt = datetime.fromisoformat(last_access_str)
                            if last_access_dt >= tracker.first_sent_at:
                                has_accessed = True
                        except Exception:
                            pass

                # Se abriu o e-mail ou acessou o sistema: encerra o tracker com sucesso
                if tracker.opened_at or has_accessed:
                    tracker.status = 'opened'
                    db.session.commit()
                    logger.info(f"[Email Tracker] Aluno {tracker.email} já abriu ou acessou. Rastreamento finalizado.")
                    continue

                student_data = dict(tracker.student_data or {})
                base_url = tracker.base_url or ''

                if tracker.stage == 1:
                    # ─── ETAPA 2: 30 minutos sem abertura -> Reenviar dados de acesso ───
                    logger.info(f"[Email Tracker] {tracker.email} não abriu em 30 min. Reenviando acesso (etapa 2)...")
                    
                    student_data['_is_retry'] = True
                    if base_url:
                        student_data['tracking_pixel_url'] = f"{base_url}/api/track/email-open/{tracker.tracking_token}"

                    success, msg = send_brevo_email(settings_dict, student_data)
                    if success:
                        tracker.stage = 2
                        tracker.last_sent_at = now
                        tracker.next_check_at = now + timedelta(minutes=30)
                        db.session.commit()
                        logger.info(f"[Email Tracker] Reenvio (etapa 2) para {tracker.email} concluído com sucesso.")
                    else:
                        logger.error(f"[Email Tracker] Falha ao reenviar acesso para {tracker.email}: {msg}")
                        # Reagendar nova tentativa em 5 min
                        tracker.next_check_at = now + timedelta(minutes=5)
                        db.session.commit()

                elif tracker.stage == 2:
                    # ─── ETAPA 3: +30 minutos sem abertura (60m total) -> Mensagem de SPAM e Suporte ───
                    logger.info(f"[Email Tracker] {tracker.email} não abriu novamente após 30 min. Enviando aviso de SPAM / suporte...")

                    success, msg = send_spam_fallback_email(
                        settings_dict=settings_dict,
                        student_data=student_data,
                        base_url=base_url,
                        support_email=support_email,
                        support_whatsapp=support_whatsapp,
                        tracking_token=tracker.tracking_token,
                    )

                    if success:
                        tracker.stage = 3
                        tracker.status = 'fallback_sent'
                        tracker.next_check_at = None
                        db.session.commit()
                        logger.info(f"[Email Tracker] Aviso de SPAM/suporte (etapa 3) enviado com sucesso para {tracker.email}.")
                    else:
                        logger.error(f"[Email Tracker] Falha ao enviar aviso de SPAM para {tracker.email}: {msg}")
                        tracker.next_check_at = now + timedelta(minutes=5)
                        db.session.commit()

        except Exception as e:
            logger.error(f"[Email Tracker] Erro ao processar fila de rastreamento: {e}", exc_info=True)
            try:
                db.session.rollback()
            except Exception:
                pass
