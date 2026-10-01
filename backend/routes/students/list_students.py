from flask import Blueprint, jsonify, session, request
from functools import wraps
from sqlalchemy import func, or_
from db.database import db
from models import Admin, Student, Course, student_courses

list_students_bp = Blueprint('list_students', __name__)

DEFAULT_PER_PAGE = 10


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@list_students_bp.route('/', methods=['GET'])
@admin_required
def list_students():
    """
    List students with pagination or search.

    Query params:
        page (int)     — page number (1-indexed), default 1
        per_page (int) — items per page, default 10
        search (str)   — search by name / email (bypasses pagination)
        course_id (int)— filter by course id (bypasses pagination)
    """
    search = request.args.get('search', '').strip()
    course_id = request.args.get('course_id', type=int)
    has_filters = bool(search) or bool(course_id)

    query = Student.query.order_by(Student.id.desc())

    # Apply filters
    if search:
        like = f'%{search}%'
        query = query.filter(
            or_(
                Student.name.ilike(like),
                Student.email.ilike(like),
                Student.phone.ilike(like),
                Student.extra_data.cast(db.Text).ilike(like)
            )
        )

    if course_id:
        query = query.filter(Student.courses.any(Course.id == course_id))

    # When filters are active → return ALL matching (no pagination)
    if has_filters:
        students = query.all()
        tracker_map = _get_trackers_for_students(students)
        return jsonify({
            'students': [_serialize(s, tracker_map.get(s.id) or tracker_map.get((s.email or '').lower())) for s in students],
            'total': len(students),
            'page': 1,
            'per_page': len(students),
            'pages': 1,
        })

    # Otherwise → paginated
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', DEFAULT_PER_PAGE, type=int)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    tracker_map = _get_trackers_for_students(pagination.items)

    return jsonify({
        'students': [_serialize(s, tracker_map.get(s.id) or tracker_map.get((s.email or '').lower())) for s in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
    })


import logging
logger = logging.getLogger(__name__)


def _get_trackers_for_students(students_list):
    """Retorna um dicionário mapeando student_id e email para o tracker mais recente."""
    if not students_list:
        return {}

    try:
        from models import StudentEmailAccessTracker
        student_ids = [s.id for s in students_list if s.id]
        student_emails = [s.email.lower() for s in students_list if s.email]

        conditions = []
        if student_ids:
            conditions.append(StudentEmailAccessTracker.student_id.in_(student_ids))
        if student_emails:
            conditions.append(StudentEmailAccessTracker.email.in_(student_emails))

        if not conditions:
            return {}

        trackers = StudentEmailAccessTracker.query.filter(
            or_(*conditions)
        ).order_by(StudentEmailAccessTracker.id.asc()).all()

        tracker_map = {}
        for t in trackers:
            if t.student_id:
                tracker_map[t.student_id] = t
            if t.email:
                tracker_map[t.email.lower()] = t
        return tracker_map
    except Exception as e:
        logger.warning(f"Erro ao carregar trackers de e-mail dos alunos: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return {}


def _serialize(s: Student, tracker=None) -> dict:
    has_courses = len(s.courses) > 0
    extra = s.extra_data or {}

    email_status = None
    email_opened_at = None
    email_last_sent_at = None
    email_stage = None

    if tracker:
        email_status = tracker.status
        email_opened_at = tracker.opened_at.isoformat() if tracker.opened_at else None
        email_last_sent_at = tracker.last_sent_at.isoformat() if tracker.last_sent_at else None
        email_stage = tracker.stage

    return {
        'id': s.id,
        'name': s.name,
        'email': s.email,
        'phone': s.phone or '',
        'status': 'active' if has_courses else 'inactive',
        'courses': [{'id': c.id, 'name': c.name} for c in s.courses],
        'createdAt': s.created_at.isoformat() if s.created_at else None,
        'lastAccessAt': extra.get('last_access_at'),
        'emailStatus': email_status,
        'emailOpenedAt': email_opened_at,
        'emailLastSentAt': email_last_sent_at,
        'emailStage': email_stage,
        'quickAccessToken': s.uuid,
        'extra_data': extra,
    }


@list_students_bp.route('/<int:student_id>/access', methods=['GET'])
@admin_required
def get_student_access(student_id):
    """Return access info for a specific student."""
    student = Student.query.get_or_404(student_id)
    extra = student.extra_data or {}
    last_access = extra.get('last_access_at')

    tracker = None
    try:
        from models import StudentEmailAccessTracker
        tracker = StudentEmailAccessTracker.query.filter(
            or_(
                StudentEmailAccessTracker.student_id == student.id,
                StudentEmailAccessTracker.email == student.email.lower()
            )
        ).order_by(StudentEmailAccessTracker.id.desc()).first()
    except Exception as e:
        logger.warning(f"Erro ao carregar tracker para aluno {student_id}: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass

    return jsonify({
        'student_id': student.id,
        'name': student.name,
        'email': student.email,
        'has_accessed': bool(last_access),
        'last_access_at': last_access,
        'email_status': tracker.status if tracker else 'not_sent',
        'email_opened_at': tracker.opened_at.isoformat() if tracker and tracker.opened_at else None,
        'email_last_sent_at': tracker.last_sent_at.isoformat() if tracker and tracker.last_sent_at else None,
        'created_at': student.created_at.isoformat() if student.created_at else None
    })


@list_students_bp.route('/<int:student_id>/activities', methods=['GET'])
@admin_required
def get_student_activities(student_id):
    """Return recent activity logs for a specific student."""
    student = Student.query.get_or_404(student_id)
    logs = []
    try:
        from models import StudentActivityLog
        limit = request.args.get('limit', 50, type=int)
        logs = StudentActivityLog.query.filter_by(student_id=student.id)\
            .order_by(StudentActivityLog.created_at.desc())\
            .limit(min(limit, 100))\
            .all()
    except Exception as e:
        logger.warning(f"Erro ao carregar logs de atividade para aluno {student_id}: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass

    ACTION_META = {
        'login': {'icon': 'ri-login-box-line', 'color': 'text-blue-500 bg-blue-500/10 border-blue-500/20'},
        'quick_access': {'icon': 'ri-flashlight-line', 'color': 'text-amber-500 bg-amber-500/10 border-amber-500/20'},
        'view_courses': {'icon': 'ri-book-open-line', 'color': 'text-purple-500 bg-purple-500/10 border-purple-500/20'},
        'view_course': {'icon': 'ri-folder-open-line', 'color': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'},
        'view_module': {'icon': 'ri-archive-line', 'color': 'text-sky-500 bg-sky-500/10 border-sky-500/20'},
        'view_lesson': {'icon': 'ri-play-circle-line', 'color': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'},
        'complete_lesson': {'icon': 'ri-checkbox-circle-line', 'color': 'text-green-600 bg-green-500/10 border-green-500/20'},
        'uncomplete_lesson': {'icon': 'ri-close-circle-line', 'color': 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'},
        'update_profile': {'icon': 'ri-user-settings-line', 'color': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'},
        'change_password': {'icon': 'ri-key-line', 'color': 'text-orange-500 bg-orange-500/10 border-orange-500/20'},
    }

    activities = []
    for l in logs:
        meta = ACTION_META.get(l.action, {'icon': 'ri-time-line', 'color': 'text-muted-foreground bg-muted border-border'})
        activities.append({
            'id': l.id,
            'action': l.action,
            'description': l.description,
            'module_name': l.module_name,
            'item_name': l.item_name,
            'ip_address': l.ip_address,
            'user_agent': l.user_agent,
            'created_at': l.created_at.isoformat() if l.created_at else None,
            'icon': meta['icon'],
            'color': meta['color'],
        })

    return jsonify({
        'student_id': student.id,
        'name': student.name,
        'email': student.email,
        'total': len(activities),
        'activities': activities,
    })



@list_students_bp.route('/courses', methods=['GET'])
@admin_required
def list_available_courses():
    """List all courses for filter/assignment dropdowns."""
    courses = Course.query.order_by(Course.name).all()
    return jsonify([{'id': c.id, 'name': c.name} for c in courses])


@list_students_bp.route('/stats', methods=['GET'])
@admin_required
def students_stats():
    """Return aggregated student stats."""
    total = Student.query.count()

    active = db.session.query(
        func.count(func.distinct(student_courses.c.student_id))
    ).scalar() or 0

    inactive = total - active

    return jsonify({
        'total': total,
        'active': active,
        'inactive': inactive,
    })
