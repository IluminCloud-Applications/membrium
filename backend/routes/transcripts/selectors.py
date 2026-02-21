from flask import Blueprint, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, Course, Module, Lesson, LessonTranscript

selectors_bp = Blueprint('transcripts_selectors', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@selectors_bp.route('/courses', methods=['GET'])
@admin_required
def get_courses():
    """Get all courses for the modal selector."""
    try:
        courses = Course.query.order_by(Course.name).all()
        return jsonify([{'id': c.id, 'name': c.name} for c in courses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@selectors_bp.route('/courses/<int:course_id>/modules', methods=['GET'])
@admin_required
def get_course_modules(course_id):
    """Get modules for a specific course."""
    try:
        modules = Module.query.filter_by(course_id=course_id).order_by(Module.order).all()
        return jsonify([{
            'id': m.id,
            'name': m.name,
            'courseId': course_id,
        } for m in modules])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@selectors_bp.route('/modules/<int:module_id>/lessons', methods=['GET'])
@admin_required
def get_module_lessons(module_id):
    """Get lessons for a module (only lessons without existing transcripts)."""
    try:
        # Subquery: lesson IDs that already have transcripts
        existing_lessons = (
            db.session.query(LessonTranscript.lesson_id)
            .distinct()
            .subquery()
        )

        lessons = (
            Lesson.query
            .outerjoin(existing_lessons, Lesson.id == existing_lessons.c.lesson_id)
            .filter(
                Lesson.module_id == module_id,
                existing_lessons.c.lesson_id.is_(None),
            )
            .order_by(Lesson.order)
            .all()
        )

        return jsonify([{
            'id': l.id,
            'name': l.title,
            'moduleId': module_id,
        } for l in lessons])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
