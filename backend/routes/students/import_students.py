from flask import Blueprint, Response, jsonify, session, request, current_app
from functools import wraps
from werkzeug.security import generate_password_hash
from db.database import db
from models import Admin, Student, Course
import json

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


import threading
import time

def start_background_notifications(app, settings_dict, students_list, default_password, base_url, send_email, send_wa):
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

            for student in students_list:
                courses_names = ', '.join(student['courses']) if student['courses'] else 'Nenhum curso'
                student_data = {
                    'name': student['name'],
                    'first_name': student['name'].split()[0] if student['name'] else student['name'],
                    'email': student['email'],
                    'password': default_password,
                    'link': f"{base_url}/login",
                    'fast_link': f"{base_url}/access/{student['uuid']}",
                    'curso': courses_names,
                    'unsubscribe_link': f"{base_url}/unsubscribe?email={student['email']}",
                }
                
                try:
                    dispatch_notifications(
                        settings_dict=settings_dict,
                        student_data=student_data,
                        phone=student['phone']
                    )
                except Exception as e:
                    print(f"[Import Notification Worker] Erro ao enviar para {student['email']}: {str(e)}")
                
                # Delay de 1 segundo para evitar gargalos e rate limit nas APIs
                time.sleep(1.0)

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
    default_password = data.get('defaultPassword', 'senha123').strip()

    if not student_list:
        return jsonify({'success': False, 'message': 'Nenhum aluno para importar'}), 400

    if not default_password:
        default_password = 'senha123'

    # Carregar configurações e base_url sob o request context ATIVO da rota HTTP
    from routes.students.resend_access import _get_settings_dict, _get_base_url
    settings_dict = _get_settings_dict()
    base_url = _get_base_url()

    app = current_app._get_current_object()

    def generate():
        with app.app_context():
            # Resolve courses inside the generator's active session
            courses = []
            for cid in course_ids:
                course = Course.query.get(cid)
                if course:
                    courses.append(course)

            total = len(student_list)
            imported = 0
            skipped = 0
            errors = []
            new_students_to_notify = []

            for i, entry in enumerate(student_list):
                name = entry.get('name', '').strip()
                email = entry.get('email', '').strip().lower()
                phone = entry.get('phone', '').strip() if entry.get('phone') else None

                if not email:
                    errors.append(f'Linha {i + 1}: email vazio')
                    skipped += 1
                    yield json.dumps({
                        'progress': {
                            'current': i + 1,
                            'total': total,
                            'imported': imported,
                            'skipped': skipped,
                        }
                    }) + '\n'
                    continue

                if not name:
                    name = email.split('@')[0]

                # Check existing
                existing = Student.query.filter(
                    Student.email.ilike(email)
                ).first()

                if existing:
                    # Add courses to existing student
                    for c in courses:
                        if c not in existing.courses:
                            existing.courses.append(c)
                    if phone and not existing.phone:
                        existing.phone = phone
                    db.session.commit()
                    skipped += 1
                else:
                    # Create new student
                    hashed = generate_password_hash(default_password)
                    new_student = Student(email=email, password=hashed, name=name, phone=phone, extra_data={'source': 'manual'})
                    db.session.add(new_student)
                    db.session.flush()
                    for c in courses:
                        new_student.courses.append(c)
                    db.session.commit()
                    imported += 1

                    # Adiciona para disparo em background
                    new_students_to_notify.append({
                        'name': name,
                        'email': email,
                        'phone': phone,
                        'uuid': new_student.uuid,
                        'courses': [c.name for c in courses]
                    })

                yield json.dumps({
                    'progress': {
                        'current': i + 1,
                        'total': total,
                        'imported': imported,
                        'skipped': skipped,
                    }
                }) + '\n'

            # Verifica se pelo menos um dos canais de disparo está configurado e ativo
            has_active_email = settings_dict.get('brevo_enabled') and settings_dict.get('brevo_api_key') and send_email
            has_active_wa = settings_dict.get('evolution_enabled') and settings_dict.get('evolution_api_key') and send_wa

            # Dispara as notificações se houver alunos novos e flags habilitadas
            if new_students_to_notify and (has_active_email or has_active_wa):
                start_background_notifications(
                    app=app,
                    settings_dict=settings_dict,
                    students_list=new_students_to_notify,
                    default_password=default_password,
                    base_url=base_url,
                    send_email=send_email,
                    send_wa=send_wa
                )

            yield json.dumps({
                'done': True,
                'imported': imported,
                'skipped': skipped,
                'total': total,
                'errors': errors,
            }) + '\n'

    return Response(generate(), mimetype='application/x-ndjson')
