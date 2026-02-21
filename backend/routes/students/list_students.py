from flask import Blueprint, jsonify, session, request
from functools import wraps
from sqlalchemy import func, or_
from db.database import db
from models import Admin, Student, Course, student_courses

list_students_bp = Blueprint('list_students', __name__)


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
    """List all students with their enrolled courses."""
    students = Student.query.order_by(Student.id.desc()).all()

    result = []
    for s in students:
        has_courses = len(s.courses) > 0
        result.append({
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'phone': s.phone or '',
            'status': 'active' if has_courses else 'inactive',
            'courses': [{'id': c.id, 'name': c.name} for c in s.courses],
            'createdAt': None,  # Model has no created_at
            'quickAccessToken': s.uuid,
        })

    return jsonify(result)


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
