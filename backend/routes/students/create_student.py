from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from db.database import db
from models import Admin, Student, Course
from db.integration_helpers import get_integration
import logging

logger = logging.getLogger(__name__)

create_student_bp = Blueprint('create_student', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@create_student_bp.route('/', methods=['POST'])
@admin_required
def create_student():
    """Create a new student and optionally enroll in multiple courses."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    raw_password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()
    course_ids = data.get('courseIds', [])
    send_notifications = data.get('sendNotifications', data.get('sendEmail', False))

    if not name or not email:
        return jsonify({'success': False, 'message': 'Nome e email são obrigatórios'}), 400

    # Obter senha padrão configurada no sistema se não informada
    _, signup_config = get_integration('student_signup')
    default_pw = signup_config.get('new_student_password', '').strip() or 'senha123'
    password = raw_password or default_pw

    # Block student email from being the same as admin email
    admin = Admin.query.get(session['user_id'])
    if admin and admin.email.lower() == email:
        return jsonify({'success': False, 'message': 'O email do aluno não pode ser igual ao do administrador'}), 400

    hashed_password = generate_password_hash(password)

    try:
        new_student = Student(email=email, password=hashed_password, name=name, phone=phone, extra_data={'source': 'manual'})
        db.session.add(new_student)
        db.session.flush()

        # Enroll in multiple courses
        enrolled_courses = []
        for cid in course_ids:
            course = Course.query.get(cid)
            if course:
                enrolled_courses.append(course)

        if enrolled_courses:
            try:
                from webhook.core import record_student_course_event
                record_student_course_event(
                    student=new_student,
                    courses=enrolled_courses,
                    add=True,
                    extra_data={'source': 'manual'},
                )
            except Exception:
                pass
            for course in enrolled_courses:
                new_student.courses.append(course)

        db.session.commit()

        # Disparar notificações de boas-vindas em background se solicitado
        if send_notifications:
            try:
                from flask import current_app
                from routes.students.resend_access import _get_settings_dict, _get_base_url
                from integrations import dispatch_notifications_async

                settings_dict = _get_settings_dict()
                base_url = _get_base_url()
                courses_names = ', '.join([c.name for c in enrolled_courses]) if enrolled_courses else 'Nenhum curso'

                student_data = {
                    'name': new_student.name,
                    'first_name': new_student.name.split()[0] if new_student.name else new_student.name,
                    'email': new_student.email,
                    'password': password,
                    'link': f"{base_url}/login",
                    'fast_link': f"{base_url}/access/{new_student.uuid}",
                    'curso': courses_names,
                    'unsubscribe_link': f"{base_url}/unsubscribe?email={new_student.email}",
                    'base_url': base_url,
                }
                dispatch_notifications_async(
                    app=current_app._get_current_object(),
                    settings_dict=settings_dict,
                    student_data=student_data,
                    phone=new_student.phone,
                )
            except Exception as e:
                logger.error(f"Erro ao disparar notificações para aluno criado manualmente: {e}")

        return jsonify({
            'success': True,
            'message': 'Aluno criado com sucesso',
            'student': {
                'id': new_student.id,
                'name': new_student.name,
                'email': new_student.email,
                'phone': new_student.phone or '',
                'status': 'active' if new_student.courses else 'inactive',
                'courses': [{'id': c.id, 'name': c.name} for c in new_student.courses],
                'createdAt': new_student.created_at.isoformat() if new_student.created_at else None,
                'quickAccessToken': new_student.uuid,
                'extra_data': new_student.extra_data or {},
            }
        })

    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Email já está em uso'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500
