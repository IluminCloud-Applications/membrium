from flask import Blueprint, jsonify, request, session, url_for
from functools import wraps
from datetime import datetime
from db.database import db
from db.utils import ensure_upload_directory
from models import Admin, Course, Module, Lesson, FAQ, LessonTranscript, Document
import os

modules_bp = Blueprint('course_mod_modules', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@modules_bp.route('/<int:course_id>/modules', methods=['POST'])
@admin_required
def create_module(course_id):
    """Create a new module for a course."""
    course = Course.query.get_or_404(course_id)
    name = request.form.get('name', '').strip()
    image = request.files.get('image')
    unlock_after_days = int(request.form.get('unlock_after_days', 0))

    if not name:
        return jsonify({'success': False, 'message': 'Nome é obrigatório'}), 400

    filename = None
    if image:
        ensure_upload_directory()
        filename = f"module_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
        image.save(os.path.join('static/uploads', filename))

    new_module = Module(
        name=name,
        image=filename,
        course=course,
        order=len(course.modules) + 1,
        unlock_after_days=unlock_after_days,
    )
    db.session.add(new_module)
    db.session.commit()

    return jsonify({
        'success': True,
        'module': {
            'id': new_module.id,
            'name': new_module.name,
            'image': url_for('static', filename=f'uploads/{new_module.image}') if new_module.image else None,
            'order': new_module.order,
            'unlock_after_days': new_module.unlock_after_days,
            'lessons': [],
        }
    })


@modules_bp.route('/modules/<int:module_id>', methods=['PUT'])
@admin_required
def update_module(module_id):
    """Update a module."""
    try:
        module = Module.query.get_or_404(module_id)
        module.name = request.form.get('name', module.name)
        unlock = request.form.get('unlock_after_days')
        if unlock is not None:
            module.unlock_after_days = int(unlock)

        image = request.files.get('image')
        if image:
            ensure_upload_directory()
            filename = f"module_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            image.save(os.path.join('static/uploads', filename))
            if module.image:
                old_path = os.path.join('static/uploads', module.image)
                if os.path.exists(old_path):
                    os.remove(old_path)
            module.image = filename

        # Handle image removal
        if request.form.get('image_removed') == 'true' and not image:
            if module.image:
                old_path = os.path.join('static/uploads', module.image)
                if os.path.exists(old_path):
                    os.remove(old_path)
                module.image = None

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        print(f"Erro ao atualizar módulo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao atualizar módulo'}), 500


@modules_bp.route('/modules/<int:module_id>', methods=['DELETE'])
@admin_required
def delete_module(module_id):
    """Delete a module and all its nested data."""
    try:
        module = Module.query.get_or_404(module_id)

        for lesson in Lesson.query.filter_by(module_id=module_id).all():
            for faq in FAQ.query.filter_by(lesson_id=lesson.id).all():
                db.session.delete(faq)
            transcript = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()
            if transcript:
                db.session.delete(transcript)
            for doc in lesson.documents[:]:
                try:
                    file_path = os.path.join('static/uploads', doc.filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception:
                    pass
                db.session.delete(doc)
            db.session.delete(lesson)

        if module.image:
            image_path = os.path.join('static/uploads', module.image)
            if os.path.exists(image_path):
                os.remove(image_path)

        db.session.delete(module)
        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        print(f"Erro ao deletar módulo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar módulo'}), 500


@modules_bp.route('/modules/reorder', methods=['POST'])
@admin_required
def reorder_modules():
    """Reorder modules by providing an ordered list of IDs."""
    data = request.get_json()
    new_order = data.get('order', [])
    for index, module_id in enumerate(new_order, start=1):
        module = Module.query.get(module_id)
        if module:
            module.order = index
    db.session.commit()
    return jsonify({'success': True})
