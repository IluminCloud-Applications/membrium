from flask import Blueprint, jsonify, request, session, url_for
from functools import wraps
from datetime import datetime
from db.database import db
from db.utils import ensure_upload_directory
from models import (
    Admin, Course, Module, Lesson, Document,
    Showcase, FAQ, LessonTranscript
)
import os

crud_courses_bp = Blueprint('courses_crud', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@crud_courses_bp.route('', methods=['POST'])
@admin_required
def create_course():
    """Create a new course."""
    name = request.form.get('name', '').strip()
    description = request.form.get('description', '').strip()
    category = request.form.get('category', 'principal')
    image = request.files.get('image')

    if not name:
        return jsonify({'success': False, 'message': 'Nome é obrigatório'}), 400

    filename = None
    if image:
        ensure_upload_directory()
        filename = f"course_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
        image.save(os.path.join('static/uploads', filename))

    new_course = Course(
        name=name,
        description=description,
        category=category,
        image=filename,
    )
    db.session.add(new_course)
    db.session.commit()

    return jsonify({
        'success': True,
        'course': {
            'id': new_course.id,
            'uuid': new_course.uuid,
            'name': new_course.name,
        }
    })


@crud_courses_bp.route('/<int:course_id>', methods=['PUT'])
@admin_required
def update_course(course_id):
    """Update an existing course."""
    try:
        course = Course.query.get_or_404(course_id)
        course.name = request.form.get('name', course.name)
        course.description = request.form.get('description', course.description)
        course.category = request.form.get('category', course.category)

        # Handle is_published
        is_published = request.form.get('is_published')
        if is_published is not None:
            course.is_published = is_published.lower() in ('true', '1')

        # Handle image
        image = request.files.get('image')
        if image:
            ensure_upload_directory()
            filename = f"course_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            image.save(os.path.join('static/uploads', filename))

            # Remove old image if exists
            if course.image:
                old_path = os.path.join('static/uploads', course.image)
                if os.path.exists(old_path):
                    os.remove(old_path)

            course.image = filename

        # Handle image removal
        if request.form.get('image_removed') == 'true' and not image:
            if course.image:
                old_path = os.path.join('static/uploads', course.image)
                if os.path.exists(old_path):
                    os.remove(old_path)
                course.image = None

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        print(f"Erro ao atualizar curso: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao atualizar curso'}), 500


@crud_courses_bp.route('/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    """Delete a course and all its related data."""
    try:
        course = Course.query.get_or_404(course_id)

        # 1. Delete showcases
        showcases = Showcase.query.filter_by(course_id=course_id).all()
        for showcase in showcases:
            if showcase.image:
                image_path = os.path.join('static/uploads', showcase.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            db.session.delete(showcase)

        # 2. Delete modules with all nested data
        modules = Module.query.filter_by(course_id=course_id).all()
        for module in modules:
            lessons = Lesson.query.filter_by(module_id=module.id).all()
            for lesson in lessons:
                # Delete FAQs
                for faq in FAQ.query.filter_by(lesson_id=lesson.id).all():
                    db.session.delete(faq)

                # Delete transcripts
                transcript = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()
                if transcript:
                    db.session.delete(transcript)

                # Delete documents
                for doc in lesson.documents[:]:
                    try:
                        file_path = os.path.join('static/uploads', doc.filename)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except Exception:
                        pass
                    db.session.delete(doc)

                db.session.delete(lesson)

            # Remove module image
            if module.image:
                image_path = os.path.join('static/uploads', module.image)
                if os.path.exists(image_path):
                    os.remove(image_path)

            db.session.delete(module)

        # 3. Remove course image
        if course.image:
            image_path = os.path.join('static/uploads', course.image)
            if os.path.exists(image_path):
                os.remove(image_path)

        # 4. Remove from groups
        from models import course_group_courses
        db.session.execute(
            course_group_courses.delete().where(
                course_group_courses.c.course_id == course_id
            )
        )

        # 5. Delete the course
        db.session.delete(course)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Curso excluído com sucesso'})

    except Exception as e:
        print(f"Erro ao deletar curso: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar curso'}), 500
