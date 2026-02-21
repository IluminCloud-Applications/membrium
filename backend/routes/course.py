"""Student-facing course routes.
Admin course management is now in routes/courses/ and routes/course_modification/.
"""
from flask import Blueprint, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Course, Student, Module, Lesson, student_lessons

course_bp = Blueprint('course', __name__)


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@course_bp.route('/api/course/<int:course_id>')
@student_required
def api_get_course_details(course_id):
    """Student: get course details with progress."""
    course = Course.query.get_or_404(course_id)
    student = Student.query.get(session['user_id'])

    total_lessons = sum(len(m.lessons) for m in course.modules)
    completed_lessons = db.session.query(student_lessons).filter_by(
        student_id=student.id
    ).join(Lesson).join(Module).filter(Module.course_id == course_id).count()

    return jsonify({
        'id': course.id,
        'title': course.name,
        'description': course.description,
        'totalLessons': total_lessons,
        'completedLessons': completed_lessons,
        'modules': [{
            'id': m.id,
            'title': m.name,
            'image': m.image,
            'lessons': [{'id': l.id, 'title': l.title} for l in m.lessons],
        } for m in course.modules],
    })


@course_bp.route('/api/course/<int:course_id>/progress')
@student_required
def get_course_progress(course_id):
    """Student: get course progress percentage."""
    student = Student.query.get(session['user_id'])
    Course.query.get_or_404(course_id)

    total = db.session.query(Lesson).join(Module).filter(
        Module.course_id == course_id
    ).count()

    completed = db.session.query(student_lessons).join(Lesson).join(Module).filter(
        Module.course_id == course_id,
        student_lessons.c.student_id == student.id,
    ).count()

    pct = (completed / total * 100) if total > 0 else 0

    return jsonify({
        'course_id': course_id,
        'total_lessons': total,
        'completed_lessons': completed,
        'progress_percentage': round(pct, 1),
    })


@course_bp.route('/api/preview_course/<int:course_id>')
@admin_required
def api_preview_course_details(course_id):
    """Admin preview API (used by pre-visualização do curso)."""
    course = Course.query.get_or_404(course_id)
    return jsonify({
        'id': course.id,
        'title': course.name,
        'description': course.description,
        'modules': [{
            'id': m.id,
            'title': m.name,
            'image': m.image or '/static/default-module-image.jpg',
            'lessons': [{'id': l.id, 'title': l.title} for l in m.lessons],
        } for m in course.modules],
    })
