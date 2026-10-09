"""External REST API for students — search, profile, quick access, password reset."""
import os
import secrets
from uuid import uuid4
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc
from db.database import db
from models import Student, Course, Lesson, Module, student_courses, StudentActivityLog, StudentEmailAccessTracker
from db.integration_helpers import get_integration
from integrations import dispatch_notifications
from .auth import external_api_key_required

external_students_bp = Blueprint('external_students', __name__)


def _get_base_url():
    """Retorna a URL base pública da aplicação, respeitando CUSTOM_DOMAIN e headers de proxy."""
    custom_domain = os.environ.get('CUSTOM_DOMAIN')
    if custom_domain and custom_domain.strip():
        domain = custom_domain.strip()
        if not domain.startswith(('http://', 'https://')):
            domain = f"https://{domain}"
        return domain.rstrip('/')

    proto = request.headers.get('X-Forwarded-Proto')
    host = request.headers.get('X-Forwarded-Host')
    if proto and host:
        return f"{proto}://{host}".rstrip('/')

    return request.url_root.rstrip('/')


def find_student(identifier: str):
    """
    Localiza um estudante por ID numérico, UUID ou E-mail.
    Facilita o uso por bots e agentes externos sem precisar converter tipos.
    """
    if not identifier:
        return None

    ident_str = str(identifier).strip()

    # 1. Se for numérico, tenta buscar por ID
    if ident_str.isdigit():
        student = Student.query.get(int(ident_str))
        if student:
            return student

    # 2. Tenta buscar por UUID
    student = Student.query.filter_by(uuid=ident_str).first()
    if student:
        return student

    # 3. Tenta buscar por E-mail (case insensitive)
    student = Student.query.filter(Student.email.ilike(ident_str)).first()
    if student:
        return student

    # 4. Tenta buscar por Telefone exato
    student = Student.query.filter_by(phone=ident_str).first()
    if student:
        return student

    return None


def _get_settings_dict():
    """Retorna as configurações necessárias para envio de notificações."""
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    _, support = get_integration('support')

    return {
        'brevo_enabled': brevo_enabled,
        'brevo_api_key': brevo.get('api_key'),
        'brevo_email_subject': brevo.get('email_subject'),
        'brevo_email_template': brevo.get('email_template'),
        'brevo_template_mode': brevo.get('template_mode'),
        'brevo_forgot_email_subject': brevo.get('forgot_email_subject'),
        'brevo_forgot_email_template': brevo.get('forgot_email_template'),
        'brevo_forgot_template_mode': brevo.get('forgot_template_mode'),
        'sender_name': support.get('sender_name'),
        'sender_email': support.get('sender_email'),
        'support_email': support.get('email'),
        'evolution_enabled': evolution_enabled,
        'evolution_url': evolution.get('url'),
        'evolution_api_key': evolution.get('api_key'),
        'evolution_message_template': evolution.get('message_template'),
        'evolution_version': evolution.get('version'),
        'evolution_instance': evolution.get('instance'),
    }


# ─── 1. ENCONTRAR ALUNOS (SEARCH) ─────────────────────────────────

@external_students_bp.route('/students/search', methods=['GET'])
@external_api_key_required
def search_students():
    """
    Busca alunos por termos parciais ou exatos (nome, e-mail, telefone ou metadados).
    Retorno resumido e rápido, ideal para bots de chat e ferramentas de automação.
    """
    query_param = request.args.get('query') or request.args.get('q') or request.args.get('search')
    email_param = request.args.get('email')
    phone_param = request.args.get('phone')
    name_param = request.args.get('name')
    limit = min(request.args.get('limit', 20, type=int), 100)

    base_query = Student.query

    # Filtros específicos
    if email_param:
        base_query = base_query.filter(Student.email.ilike(f"%{email_param.strip()}%"))
    if phone_param:
        base_query = base_query.filter(Student.phone.ilike(f"%{phone_param.strip()}%"))
    if name_param:
        base_query = base_query.filter(Student.name.ilike(f"%{name_param.strip()}%"))

    # Busca genérica em múltiplos campos
    if query_param:
        search_like = f"%{query_param.strip()}%"
        base_query = base_query.filter(
            or_(
                Student.name.ilike(search_like),
                Student.email.ilike(search_like),
                Student.phone.ilike(search_like),
                Student.extra_data.cast(db.Text).ilike(search_like),
            )
        )

    students = base_query.order_by(Student.id.desc()).limit(limit).all()
    base_url = _get_base_url()

    results = []
    for s in students:
        extra = s.extra_data or {}
        results.append({
            'id': s.id,
            'uuid': s.uuid,
            'name': s.name,
            'email': s.email,
            'phone': s.phone or '',
            'status': 'active' if len(s.courses) > 0 else 'inactive',
            'courses_count': len(s.courses),
            'courses': [{'id': c.id, 'name': c.name} for c in s.courses],
            'quick_access_url': f"{base_url}/access/{s.uuid}",
            'last_access_at': extra.get('last_access_at'),
            'created_at': s.created_at.isoformat() if s.created_at else None,
        })

    return jsonify({
        'success': True,
        'total': len(results),
        'students': results,
    })


# ─── 2. GERAR / OBTER ACESSO ÚNICO (QUICK ACCESS LINK) ───────────

@external_students_bp.route('/students/<identifier>/quick-access', methods=['GET', 'POST'])
@external_api_key_required
def get_student_quick_access(identifier):
    """
    Gera e retorna o link de acesso direto do aluno (Acesso Rápido por UUID).
    Permite passar id, uuid ou email no parâmetro.
    Se refresh=true for enviado, gera um novo UUID para o aluno invalidando o anterior.
    """
    student = find_student(identifier)
    if not student:
        return jsonify({'success': False, 'error': 'Aluno não encontrado.'}), 404

    # Garante que o aluno tenha um UUID
    refresh = request.args.get('refresh', '').lower() in ('true', '1') or (
        request.is_json and request.get_json(silent=True) and request.get_json(silent=True).get('refresh')
    )

    if not student.uuid or refresh:
        student.uuid = str(uuid4())
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': f'Erro ao atualizar token: {str(e)}'}), 500

    base_url = _get_base_url()
    quick_access_url = f"{base_url}/access/{student.uuid}"
    direct_url = f"{base_url}/quick-access/{student.uuid}"

    return jsonify({
        'success': True,
        'student': {
            'id': student.id,
            'uuid': student.uuid,
            'name': student.name,
            'email': student.email,
            'phone': student.phone or '',
        },
        'quick_access_token': student.uuid,
        'quick_access_url': quick_access_url,
        'direct_url': direct_url,
        'login_url': f"{base_url}/login",
    })


# ─── 3. OBTER DADOS COMPLETOS DO ALUNO (DETALHADO) ───────────────

@external_students_bp.route('/students/<identifier>', methods=['GET'])
@external_api_key_required
def get_student_details(identifier):
    """
    Retorna a ficha completa do aluno:
    - Dados cadastrais e status
    - Cursos matriculados com aulas totais, concluídas e % de progresso
    - Resumo de progresso geral
    - Últimos registros de atividades na plataforma
    - Status de entrega de e-mails/rastreamento
    """
    student = find_student(identifier)
    if not student:
        return jsonify({'success': False, 'error': 'Aluno não encontrado.'}), 404

    base_url = _get_base_url()
    extra = student.extra_data or {}

    # Mapear progresso por curso
    completed_lesson_ids = {l.id for l in student.completed_lessons}

    courses_detail = []
    total_platform_lessons = 0
    total_completed_lessons = 0

    for c in student.courses:
        # Obter módulos deste curso
        module_ids = [m.id for m in c.modules]
        course_lessons = Lesson.query.filter(Lesson.module_id.in_(module_ids)).all() if module_ids else []
        course_lesson_count = len(course_lessons)

        completed_in_course = sum(1 for l in course_lessons if l.id in completed_lesson_ids)
        course_progress = round((completed_in_course / course_lesson_count * 100), 1) if course_lesson_count > 0 else 0.0

        total_platform_lessons += course_lesson_count
        total_completed_lessons += completed_in_course

        courses_detail.append({
            'id': c.id,
            'uuid': c.uuid,
            'name': c.name,
            'category': c.category,
            'is_published': c.is_published,
            'modules_count': len(c.modules),
            'total_lessons': course_lesson_count,
            'completed_lessons': completed_in_course,
            'progress_percentage': course_progress,
        })

    overall_progress = round((total_completed_lessons / total_platform_lessons * 100), 1) if total_platform_lessons > 0 else 0.0

    # Atividades recentes do aluno (últimos 10 registros)
    recent_logs = (
        StudentActivityLog.query.filter_by(student_id=student.id)
        .order_by(StudentActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    activities = [
        {
            'action': log.action,
            'description': log.description,
            'module_name': log.module_name,
            'item_name': log.item_name,
            'created_at': log.created_at.isoformat() if log.created_at else None,
        }
        for log in recent_logs
    ]

    # Status do rastreador de e-mail mais recente
    tracker = (
        StudentEmailAccessTracker.query.filter_by(student_id=student.id)
        .order_by(StudentEmailAccessTracker.id.desc())
        .first()
    )
    email_status = {
        'status': tracker.status if tracker else None,
        'opened_at': tracker.opened_at.isoformat() if tracker and tracker.opened_at else None,
        'last_sent_at': tracker.last_sent_at.isoformat() if tracker and tracker.last_sent_at else None,
    } if tracker else None

    return jsonify({
        'success': True,
        'student': {
            'id': student.id,
            'uuid': student.uuid,
            'name': student.name,
            'email': student.email,
            'phone': student.phone or '',
            'status': 'active' if len(student.courses) > 0 else 'inactive',
            'created_at': student.created_at.isoformat() if student.created_at else None,
            'last_access_at': extra.get('last_access_at'),
            'quick_access_url': f"{base_url}/access/{student.uuid}",
            'direct_url': f"{base_url}/quick-access/{student.uuid}",
            'progress_summary': {
                'total_lessons': total_platform_lessons,
                'completed_lessons': total_completed_lessons,
                'overall_percentage': overall_progress,
            },
            'courses': courses_detail,
            'extra_data': extra,
            'email_tracking': email_status,
            'recent_activities': activities,
        }
    })


# ─── 4. REDEFINIR SENHA DO ALUNO & DISPARAR E-MAIL ───────────────

@external_students_bp.route('/students/<identifier>/reset-password', methods=['POST'])
@external_api_key_required
def reset_student_password(identifier):
    """
    Redefine a senha do aluno (gerando uma senha temporária aleatória segura)
    e dispara as credenciais por e-mail via Brevo (e WhatsApp via Evolution se configurado).
    Retorna os dados atualizados e a nova senha gerada.
    """
    student = find_student(identifier)
    if not student:
        return jsonify({'success': False, 'error': 'Aluno não encontrado.'}), 404

    # Pode receber senha customizada no body JSON ou gerar uma automática
    req_data = request.get_json(silent=True) or {}
    custom_password = req_data.get('password', '').strip()
    new_password = custom_password if custom_password else secrets.token_urlsafe(8)

    # Atualiza a senha no banco
    student.set_password(new_password)

    # Garante que o UUID de acesso rápido esteja presente
    if not student.uuid:
        student.uuid = str(uuid4())

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Erro ao atualizar senha no banco: {str(e)}'}), 500

    # Registrar log de atividade
    try:
        StudentActivityLog.log(
            student_id=student.id,
            action='password_reset',
            description='Senha redefinida via API Externa e credenciais reenviadas.',
        )
    except Exception:
        pass

    # Obter configurações e disparar notificações (Brevo / Evolution)
    settings_dict = _get_settings_dict()
    base_url = _get_base_url()
    courses_names = ', '.join([c.name for c in student.courses]) if student.courses else 'Nenhum curso'

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'password': new_password,
        'link': f"{base_url}/login",
        'fast_link': f"{base_url}/access/{student.uuid}",
        'curso': courses_names,
        'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
        'base_url': base_url,
    }

    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=student.phone,
    )

    email_sent = results.get('email', {}).get('sent', False)
    whatsapp_sent = results.get('whatsapp', {}).get('sent', False)

    return jsonify({
        'success': True,
        'message': 'Senha redefinida com sucesso e credenciais enviadas por e-mail.',
        'student': {
            'id': student.id,
            'uuid': student.uuid,
            'name': student.name,
            'email': student.email,
            'phone': student.phone or '',
        },
        'temporary_password': new_password,
        'quick_access_url': f"{base_url}/access/{student.uuid}",
        'notifications': {
            'email_sent': email_sent,
            'whatsapp_sent': whatsapp_sent,
        }
    })
