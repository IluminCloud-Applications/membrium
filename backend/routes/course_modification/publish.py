"""Publish draft lessons for a course — changes all 'draft' lessons to 'published'."""
from flask import Blueprint, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, Course, Lesson, Module
from cache import invalidate_course, cache_delete_pattern
import logging

logger = logging.getLogger("routes.course_modification.publish")

publish_bp = Blueprint('course_mod_publish', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@publish_bp.route('/<int:course_id>/lessons/publish', methods=['POST'])
@admin_required
def publish_draft_lessons(course_id):
    """Publish all draft lessons belonging to a course."""
    course = Course.query.get_or_404(course_id)

    # Collect all draft lessons across all modules of this course
    draft_lessons = (
        Lesson.query
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id, Lesson.status == 'draft')
        .all()
    )

    if not draft_lessons:
        return jsonify({'success': True, 'published': [], 'message': 'Nenhuma aula em rascunho encontrada.'})

    published_module_ids = set()
    published = []
    for lesson in draft_lessons:
        lesson.status = 'published'
        published_module_ids.add(lesson.module_id)
        published.append({'id': lesson.id, 'title': lesson.title, 'module_id': lesson.module_id})

    db.session.commit()

    # Invalidate cache: course list, course detail and all its modules
    invalidate_course(course_id)
    cache_delete_pattern('module:*:content')

    logger.info(f"Published {len(published)} draft lessons for course {course_id}")
    return jsonify({
        'success': True,
        'published': published,
        'message': f'{len(published)} aula(s) publicada(s) com sucesso.',
    })
