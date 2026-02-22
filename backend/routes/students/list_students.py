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
            or_(Student.name.ilike(like), Student.email.ilike(like))
        )

    if course_id:
        query = query.filter(Student.courses.any(Course.id == course_id))

    # When filters are active → return ALL matching (no pagination)
    if has_filters:
        students = query.all()
        return jsonify({
            'students': [_serialize(s) for s in students],
            'total': len(students),
            'page': 1,
            'per_page': len(students),
            'pages': 1,
        })

    # Otherwise → paginated
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', DEFAULT_PER_PAGE, type=int)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'students': [_serialize(s) for s in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
    })


def _serialize(s: Student) -> dict:
    has_courses = len(s.courses) > 0
    return {
        'id': s.id,
        'name': s.name,
        'email': s.email,
        'phone': s.phone or '',
        'status': 'active' if has_courses else 'inactive',
        'courses': [{'id': c.id, 'name': c.name} for c in s.courses],
        'createdAt': s.created_at.isoformat() if s.created_at else None,
        'quickAccessToken': s.uuid,
    }


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
