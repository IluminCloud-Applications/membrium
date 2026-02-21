from flask import Blueprint, jsonify, session, url_for
from functools import wraps
from sqlalchemy import func
from db.database import db
from models import Admin, Course, Module, Lesson, student_courses

list_courses_bp = Blueprint('courses_list', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@list_courses_bp.route('', methods=['GET'])
@admin_required
def get_courses():
    """List all courses with computed stats."""
    courses = Course.query.order_by(Course.created_at.desc()).all()

    result = []
    for course in courses:
        # Count students via association table
        students_count = db.session.query(
            func.count(student_courses.c.student_id)
        ).filter(student_courses.c.course_id == course.id).scalar() or 0

        # Count lessons across all modules
        lessons_count = db.session.query(
            func.count(Lesson.id)
        ).join(Module).filter(Module.course_id == course.id).scalar() or 0

        result.append({
            'id': course.id,
            'uuid': course.uuid,
            'name': course.name,
            'description': course.description or '',
            'image': url_for('static', filename=f'uploads/{course.image}') if course.image else None,
            'category': course.category or 'principal',
            'is_published': course.is_published,
            'students_count': students_count,
            'lessons_count': lessons_count,
            'created_at': course.created_at.isoformat() if course.created_at else None,
        })

    return jsonify(result)


@list_courses_bp.route('/<int:course_id>', methods=['GET'])
@admin_required
def get_course(course_id):
    """Get a single course by ID."""
    course = Course.query.get_or_404(course_id)

    students_count = db.session.query(
        func.count(student_courses.c.student_id)
    ).filter(student_courses.c.course_id == course.id).scalar() or 0

    lessons_count = db.session.query(
        func.count(Lesson.id)
    ).join(Module).filter(Module.course_id == course.id).scalar() or 0

    return jsonify({
        'id': course.id,
        'uuid': course.uuid,
        'name': course.name,
        'description': course.description or '',
        'image': url_for('static', filename=f'uploads/{course.image}') if course.image else None,
        'category': course.category or 'principal',
        'is_published': course.is_published,
        'students_count': students_count,
        'lessons_count': lessons_count,
        'created_at': course.created_at.isoformat() if course.created_at else None,
    })


@list_courses_bp.route('/simple', methods=['GET'])
@admin_required
def get_courses_simple():
    """Lightweight course list (id + name only) for dropdowns and selectors."""
    courses = Course.query.order_by(Course.name).all()
    return jsonify([{
        'id': course.id,
        'name': course.name,
    } for course in courses])
