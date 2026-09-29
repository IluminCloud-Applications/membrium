from flask import Blueprint, Response, jsonify, session, request, current_app
from functools import wraps
from werkzeug.security import generate_password_hash
from sqlalchemy import func
from uuid import uuid4
from db.database import db
from models import Admin, Student, Course
import json
import logging
import threading
import time

logger = logging.getLogger(__name__)

import_students_bp = Blueprint('import_students', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def start_background_notifications(app, settings_dict, students_list, default_password, base_url, send_email, send_wa, courses_names):
    """Dispara notificações para alunos recém-importados em background de forma controlada."""
    def worker():
        with app.app_context():
            from integrations.dispatcher import dispatch_notifications
            
            # Sobrescrever as configurações de envio conforme a escolha do usuário na modal
            settings_dict['brevo_enabled'] = settings_dict.get('brevo_enabled') and send_email
            settings_dict['evolution_enabled'] = settings_dict.get('evolution_enabled') and send_wa
            
            # Se ambas estiverem desativadas, nem começa
            if not settings_dict.get('brevo_enabled') and not settings_dict.get('evolution_enabled'):
                return

            logger.info(f"[Import Notification Worker] Iniciando envio para {len(students_list)} novos alunos...")

            for student in students_list:
                student_data = {
                    'name': student['name'],
                    'first_name': student['name'].split()[0] if student['name'] else student['name'],
                    'email': student['email'],
                    'password': default_password,
                    'link': f"{base_url}/login",
                    'fast_link': f"{base_url}/access/{student['uuid']}",
                    'curso': courses_names,
                    'unsubscribe_link': f"{base_url}/unsubscribe?email={student['email']}",
                    'base_url': base_url,
                }

                
                try:
                    dispatch_notifications(
                        settings_dict=settings_dict,
                        student_data=student_data,
                        phone=student['phone']
                    )
                except Exception as e:
                    logger.error(f"[Import Notification Worker] Erro ao enviar para {student['email']}: {str(e)}")
                
                # Delay de 0.3s para respeitar limites das APIs externas sem demorar horas
                time.sleep(0.3)

            logger.info("[Import Notification Worker] Finalizado envio de notificações.")

    thread = threading.Thread(target=worker)
    thread.daemon = True
    thread.start()


@import_students_bp.route('/import', methods=['POST'])
@admin_required
def import_students():
    """
    Import students from a JSON payload with streaming progress.

    Body (JSON):
        students: [{ name: str, email: str, phone: str }]
        courseIds: [int]
        sendEmail: bool
        sendWhatsapp: bool
        defaultPassword: str  (optional, defaults to 'senha123')
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    student_list = data.get('students', [])
    course_ids = data.get('courseIds', [])
    send_email = data.get('sendEmail', False)
    send_wa = data.get('sendWhatsapp', False)

    from db.integration_helpers import get_integration
    _, signup_config = get_integration('student_signup')
    default_pw_from_settings = signup_config.get('new_student_password', '').strip() or 'senha123'
    default_password = data.get('defaultPassword', '').strip() or default_pw_from_settings

    if not student_list:
        return jsonify({'success': False, 'message': 'Nenhum aluno para importar'}), 400

    # 1. Hashing da senha UMA ÚNICA VEZ fora de qualquer loop (economiza 99.9% de CPU)
    hashed_password = generate_password_hash(default_password)

    # Carregar configurações e base_url sob o request context ATIVO da rota HTTP
    from routes.students.resend_access import _get_settings_dict, _get_base_url
    settings_dict = _get_settings_dict()
    base_url = _get_base_url()

    app = current_app._get_current_object()

    def generate():
        with app.app_context():
            BATCH_SIZE = 500
            total = len(student_list)
            imported = 0
            skipped = 0
            errors = []
            new_students_to_notify = []
            seen_emails = set()
            
            # Intervalo dinâmico de atualização para suavidade na UI sem travar o browser
            update_interval = max(1, min(50, total // 50))
            last_yielded_count = 0

            # Nome dos cursos formatado uma única vez
            initial_courses = Course.query.filter(Course.id.in_(course_ids)).all() if course_ids else []
            courses_names = ', '.join(c.name for c in initial_courses) if initial_courses else 'Nenhum curso'

            # Verifica se pelo menos um dos canais de disparo está configurado e ativo
            has_active_email = bool(settings_dict.get('brevo_enabled') and settings_dict.get('brevo_api_key') and send_email)
            has_active_wa = bool(settings_dict.get('evolution_enabled') and settings_dict.get('evolution_api_key') and send_wa)
            should_notify = has_active_email or has_active_wa

            if send_email and not (settings_dict.get('brevo_enabled') and settings_dict.get('brevo_api_key')):
                errors.append("Aviso: 'Enviar por E-mail' estava marcado, mas a Brevo não está ativada ou com API Key preenchida em Configurações > Integrações.")
            if send_wa and not (settings_dict.get('evolution_enabled') and settings_dict.get('evolution_api_key')):
                errors.append("Aviso: 'Enviar por WhatsApp' estava marcado, mas a Evolution API não está ativada ou configurada em Configurações > Integrações.")


            for batch_start in range(0, total, BATCH_SIZE):
                batch_raw = student_list[batch_start:batch_start + BATCH_SIZE]

                # Reconecta cursos para a sessão ativa deste lote
                courses = Course.query.filter(Course.id.in_(course_ids)).all() if course_ids else []

                # Filtrar e normalizar entradas do lote
                batch_entries = []
                for idx_in_batch, entry in enumerate(batch_raw):
                    global_idx = batch_start + idx_in_batch + 1
                    email = entry.get('email', '').strip().lower()
                    if not email:
                        errors.append(f'Linha {global_idx}: email vazio')
                        skipped += 1
                        continue

                    if email in seen_emails:
                        # Email duplicado na própria lista importada
                        skipped += 1
                        continue
                    seen_emails.add(email)

                    name = entry.get('name', '').strip() or email.split('@')[0]
                    phone = entry.get('phone', '').strip() if entry.get('phone') else None
                    batch_entries.append({
                        'name': name,
                        'email': email,
                        'phone': phone
                    })

                # Buscar alunos existentes deste lote em UMA única query
                batch_emails = [e['email'] for e in batch_entries]
                existing_map = {}
                if batch_emails:
                    existing_students = Student.query.filter(
                        func.lower(Student.email).in_(batch_emails)
                    ).all()
                    existing_map = {s.email.lower(): s for s in existing_students}

                # Processar alunos do lote
                for entry in batch_entries:
                    email = entry['email']
                    name = entry['name']
                    phone = entry['phone']

                    if email in existing_map:
                        existing = existing_map[email]
                        for c in courses:
                            if c not in existing.courses:
                                existing.courses.append(c)
                        if phone and not existing.phone:
                            existing.phone = phone
                        skipped += 1
                    else:
                        student_uuid = str(uuid4())
                        new_student = Student(
                            email=email,
                            password=hashed_password,
                            name=name,
                            phone=phone,
                            uuid=student_uuid,
                            extra_data={'source': 'manual'}
                        )
                        db.session.add(new_student)
                        for c in courses:
                            new_student.courses.append(c)
                        imported += 1

                        if should_notify:
                            new_students_to_notify.append({
                                'name': name,
                                'email': email,
                                'phone': phone,
                                'uuid': student_uuid,
                            })

                    # Envia progresso para o cliente se atingiu o intervalo
                    current_processed = imported + skipped
                    if current_processed - last_yielded_count >= update_interval:
                        last_yielded_count = current_processed
                        yield json.dumps({
                            'progress': {
                                'current': min(current_processed, total),
                                'total': total,
                                'imported': imported,
                                'skipped': skipped,
                            }
                        }) + '\n'

                # Grava o lote no banco de dados e limpa a memória do SQLAlchemy
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"Erro ao salvar lote de alunos ({batch_start} a {batch_start + len(batch_raw)}): {e}")
                    errors.append(f"Erro ao salvar lote ({batch_start} a {batch_start + len(batch_raw)}): {str(e)}")

                # Limpa todas as instâncias da memória para manter RAM constante e zero leak
                db.session.expunge_all()

                # Garante que o progresso do final do lote é enviado
                current_processed = imported + skipped
                if current_processed > last_yielded_count:
                    last_yielded_count = current_processed
                    yield json.dumps({
                        'progress': {
                            'current': min(current_processed, total),
                            'total': total,
                            'imported': imported,
                            'skipped': skipped,
                        }
                    }) + '\n'

            # Dispara as notificações se houver alunos novos e integrações ativas
            if new_students_to_notify and should_notify:
                start_background_notifications(
                    app=app,
                    settings_dict=settings_dict,
                    students_list=new_students_to_notify,
                    default_password=default_password,
                    base_url=base_url,
                    send_email=send_email,
                    send_wa=send_wa,
                    courses_names=courses_names
                )

            yield json.dumps({
                'done': True,
                'imported': imported,
                'skipped': skipped,
                'total': total,
                'errors': errors[:100],
            }) + '\n'

    return Response(generate(), mimetype='application/x-ndjson')
