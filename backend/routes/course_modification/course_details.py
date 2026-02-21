from flask import Blueprint, jsonify, request, session, url_for
from functools import wraps
from datetime import datetime
from db.database import db
from db.utils import ensure_upload_directory
from models import Admin, Course, Module, Lesson, Document
import os

course_details_bp = Blueprint('course_details', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def _image_url(filename):
    """Build image URL or return None."""
    if not filename:
        return None
    return url_for('static', filename=f'uploads/{filename}')


def _serialize_lesson(lesson):
    """Serialize a lesson for the modification page."""
    return {
        'id': lesson.id,
        'module_id': lesson.module_id,
        'title': lesson.title,
        'description': lesson.description or '',
        'video_platform': lesson.video_type or 'youtube',
        'video_url': lesson.video_url or '',
        'order': lesson.order,
        'has_cta': lesson.has_button or False,
        'cta_text': lesson.button_text or '',
        'cta_url': lesson.button_link or '',
        'cta_delay': lesson.button_delay or 0,
        'attachments': [{
            'id': doc.id,
            'name': doc.filename,
            'url': _image_url(doc.filename),
        } for doc in lesson.documents],
    }


def _serialize_module(module):
    """Serialize a module with its lessons."""
    return {
        'id': module.id,
        'course_id': module.course_id,
        'name': module.name,
        'image': _image_url(module.image),
        'order': module.order,
        'unlock_after_days': module.unlock_after_days or 0,
        'lessons': [_serialize_lesson(l) for l in module.lessons],
    }


@course_details_bp.route('/<int:course_id>', methods=['GET'])
@admin_required
def get_course_full(course_id):
    """Get full course data for the modification page."""
    course = Course.query.get_or_404(course_id)

    return jsonify({
        'id': course.id,
        'name': course.name,
        'description': course.description or '',
        'modules': [_serialize_module(m) for m in course.modules],
        'cover': {
            'desktop': _image_url(course.cover_desktop),
            'mobile': _image_url(course.cover_mobile),
        },
        'menu_items': course.menu_items or [],
    })


@course_details_bp.route('/<int:course_id>/cover', methods=['PUT'])
@admin_required
def update_cover(course_id):
    """Update course cover images (desktop and/or mobile)."""
    course = Course.query.get_or_404(course_id)
    ensure_upload_directory()

    for field in ['desktop', 'mobile']:
        file = request.files.get(field)
        removed = request.form.get(f'{field}_removed') == 'true'
        attr = f'cover_{field}'

        if file:
            filename = f"cover_{field}_{course_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            file.save(os.path.join('static/uploads', filename))
            # Remove old file
            old = getattr(course, attr)
            if old:
                old_path = os.path.join('static/uploads', old)
                if os.path.exists(old_path):
                    os.remove(old_path)
            setattr(course, attr, filename)
        elif removed:
            old = getattr(course, attr)
            if old:
                old_path = os.path.join('static/uploads', old)
                if os.path.exists(old_path):
                    os.remove(old_path)
            setattr(course, attr, None)

    db.session.commit()
    return jsonify({
        'success': True,
        'cover': {
            'desktop': _image_url(course.cover_desktop),
            'mobile': _image_url(course.cover_mobile),
        },
    })


@course_details_bp.route('/<int:course_id>/menu', methods=['PUT'])
@admin_required
def update_menu(course_id):
    """Replace all menu items for a course."""
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    if data is None:
        return jsonify({'success': False, 'message': 'Body inválido'}), 400

    course.menu_items = data.get('items', [])
    db.session.commit()

    return jsonify({
        'success': True,
        'menu_items': course.menu_items,
    })
