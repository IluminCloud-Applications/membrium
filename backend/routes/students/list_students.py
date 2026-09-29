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


def _get_trackers_for_students(students_list):
    """Retorna um dicionário mapeando student_id e email para o tracker mais recente."""
    if not students_list:
        return {}

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

    from models import StudentEmailAccessTracker
    tracker = StudentEmailAccessTracker.query.filter(
        or_(
            StudentEmailAccessTracker.student_id == student.id,
            StudentEmailAccessTracker.email == student.email.lower()
        )
    ).order_by(StudentEmailAccessTracker.id.desc()).first()

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
