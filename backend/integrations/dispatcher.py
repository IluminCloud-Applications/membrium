"""
Dispatcher central de notificações.

Ponto único de disparo para todas as integrações (email, whatsapp, futuras).
O webhook chama apenas `dispatch_notifications()` e o dispatcher
verifica quais integrações estão habilitadas e dispara cada uma.
"""
import logging
from integrations.email.brevo import send_brevo_email
from integrations.whatsapp.evolutionapi import send_whatsapp_message

logger = logging.getLogger(__name__)


def dispatch_notifications(
    settings_dict: dict,
    student_data: dict,
    phone: str | None = None,
) -> dict:
    """
    Dispara notificações para todas as integrações habilitadas.

    Args:
        settings_dict: Configurações do sistema (já carregadas do banco)
        student_data: Dicionário com dados do aluno e variáveis do template:
            - name, first_name, email, password
            - link, fast_link, curso, unsubscribe_link
        phone: Número de telefone do aluno (opcional)

    Returns:
        Dicionário com o resultado de cada integração disparada
    """
    print(f"\n=== DISPATCH NOTIFICATIONS ===")
    print(f"Student: {student_data.get('name')} ({student_data.get('email')})")
    print(f"Brevo enabled: {settings_dict.get('brevo_enabled')}, API key: {'SET' if settings_dict.get('brevo_api_key') else 'EMPTY'}")
    print(f"Evolution enabled: {settings_dict.get('evolution_enabled')}, API key: {'SET' if settings_dict.get('evolution_api_key') else 'EMPTY'}")
    print(f"Phone: {phone}")

    results = {}

    # ─── Email (Brevo) ────────────────────────────────────────────
    results['email'] = _dispatch_email(settings_dict, student_data)

    # ─── WhatsApp (Evolution API) ─────────────────────────────────
    results['whatsapp'] = _dispatch_whatsapp(settings_dict, student_data, phone)

    print(f"Results: {results}")
    print(f"=== END DISPATCH ===\n")

    return results


def _dispatch_email(settings_dict: dict, student_data: dict) -> dict:
    """Tenta enviar email via Brevo se estiver configurada."""
    if not settings_dict.get('brevo_enabled') or not settings_dict.get('brevo_api_key'):
        print("[Brevo] Não está configurado ou habilitado")
        return {'sent': False, 'reason': 'not_configured'}

    # Verificar blacklist de email
    from models import EmailBlacklist
    email = student_data.get('email', '')
    blacklisted = EmailBlacklist.query.filter_by(email=email).first()
    if blacklisted:
        print(f"[Brevo] Email {email} está na blacklist")
        return {'sent': False, 'reason': 'blacklisted'}

    # Configurar rastreamento de abertura de email e reenvios se for primeiro envio
    tracking_token = None
    is_retry = student_data.get('_is_retry', False)
    base_url = student_data.get('base_url')
    if not base_url and student_data.get('link'):
        base_url = student_data['link'].replace('/login', '').rstrip('/')
        student_data['base_url'] = base_url

    if not is_retry and base_url and email:
        import secrets
        tracking_token = secrets.token_urlsafe(32)
        student_data['tracking_token'] = tracking_token
        student_data['tracking_pixel_url'] = f"{base_url}/api/track/email-open/{tracking_token}"

    try:
        print(f"[Brevo] Enviando email para {email}...")
        success, message = send_brevo_email(settings_dict, student_data)
        print(f"[Brevo] Resultado: {'OK' if success else 'FALHOU'} - {message}")

        # Se enviou com sucesso e gerou token novo, registrar na fila de tracking
        if success and tracking_token and not is_retry:
            try:
                from models import StudentEmailAccessTracker, Student
                from db.database import db
                from datetime import datetime, timedelta

                clean_email = email.strip().lower()
                student = Student.query.filter_by(email=clean_email).first()

                # Marca trackers pendentes anteriores desse aluno como substituídos
                prev_trackers = StudentEmailAccessTracker.query.filter_by(
                    email=clean_email, status='pending'
                ).all()
                for pt in prev_trackers:
                    pt.status = 'superseded'

                new_tracker = StudentEmailAccessTracker(
                    student_id=student.id if student else None,
                    email=clean_email,
                    tracking_token=tracking_token,
                    stage=1,
                    status='pending',
                    first_sent_at=datetime.utcnow(),
                    last_sent_at=datetime.utcnow(),
                    next_check_at=datetime.utcnow() + timedelta(minutes=30),
                    base_url=base_url,
                    student_data=student_data
                )
                db.session.add(new_tracker)
                db.session.commit()
                print(f"[Email Tracker] Rastreamento registrado para {clean_email} (token: {tracking_token})")
            except Exception as e:
                logger.error(f"[Email Tracker] Erro ao registrar rastreamento de abertura: {e}")
                try:
                    from db.database import db
                    db.session.rollback()
                except Exception:
                    pass

        return {'sent': success, 'message': message}
    except Exception as e:
        print(f"[Brevo] ERRO: {str(e)}")
        return {'sent': False, 'message': str(e)}



def _dispatch_whatsapp(settings_dict: dict, student_data: dict, phone: str | None) -> dict:
    """Tenta enviar WhatsApp via Evolution API se estiver configurada."""
    if not settings_dict.get('evolution_enabled') or not settings_dict.get('evolution_api_key'):
        print("[Evolution] Não está configurado ou habilitado")
        return {'sent': False, 'reason': 'not_configured'}

    if not phone or len(phone.strip()) == 0:
        print("[Evolution] Habilitado mas aluno sem telefone")
        return {'sent': False, 'reason': 'no_phone'}

    try:
        print(f"[Evolution] Enviando WhatsApp para {phone}...")
        success, message = send_whatsapp_message(settings_dict, phone, student_data)
        print(f"[Evolution] Resultado: {'OK' if success else 'FALHOU'} - {message}")
        return {'sent': success, 'message': message}
    except Exception as e:
        print(f"[Evolution] ERRO: {str(e)}")
        return {'sent': False, 'message': str(e)}
