from flask import Blueprint, jsonify, request, session
from functools import wraps
from datetime import datetime
from werkzeug.utils import secure_filename
from db.database import db
from db.utils import ensure_upload_directory
from models import Admin, Module, Lesson, Document, FAQ, LessonTranscript
from .transcript_sync import auto_fetch_transcript
import os
import logging

logger = logging.getLogger("routes.course_modification.lessons")

lessons_bp = Blueprint('course_mod_lessons', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@lessons_bp.route('/modules/<int:module_id>/lessons', methods=['POST'])
@admin_required
def create_lesson(module_id):
    """Create a new lesson in a module."""
    module = Module.query.get_or_404(module_id)

    title = request.form.get('title', '').strip()
    description = request.form.get('description', '')
    video_url = request.form.get('video_url', '')
    video_type = request.form.get('video_platform', 'youtube')
    has_button = request.form.get('has_cta', 'false').lower() == 'true'
    button_text = request.form.get('cta_text') if has_button else None
    button_link = request.form.get('cta_url') if has_button else None
    button_delay = _parse_int(request.form.get('cta_delay'))

    if not title:
        return jsonify({'success': False, 'message': 'Título é obrigatório'}), 400

    new_lesson = Lesson(
        title=title,
        description=description,
        video_url=video_url,
        video_type=video_type,
        module=module,
        order=len(module.lessons) + 1,
        has_button=has_button,
        button_text=button_text,
        button_link=button_link,
        button_delay=button_delay,
    )
    db.session.add(new_lesson)

    # Handle document uploads
    _handle_document_uploads(request, new_lesson)

    db.session.commit()

    # Auto-fetch transcript: synchronous for YouTube, background for Cloudflare/AssemblyAI
    transcript_result = {"success": False, "message": "Skipped"}
    if video_url and new_lesson.video_type in ('youtube', 'cloudflare'):
        logger.info(f"Auto-importando transcrição para lesson={new_lesson.id} (type={new_lesson.video_type})")
        transcript_result = auto_fetch_transcript(new_lesson.id)

    return jsonify({
        'success': True,
        'lesson': _serialize_lesson(new_lesson),
        'transcript_imported': transcript_result.get('success', False),
        'transcript_message': transcript_result.get('message', ''),
    })


@lessons_bp.route('/lessons/<int:lesson_id>', methods=['PUT'])
@admin_required
def update_lesson(lesson_id):
    """Update a lesson."""
    lesson = Lesson.query.get_or_404(lesson_id)

    lesson.title = request.form.get('title', lesson.title)
    lesson.description = request.form.get('description', lesson.description)
    lesson.video_url = request.form.get('video_url', lesson.video_url)
    lesson.video_type = request.form.get('video_platform', lesson.video_type)

    has_button = request.form.get('has_cta', 'false').lower() == 'true'
    lesson.has_button = has_button
    lesson.button_text = request.form.get('cta_text') if has_button else None
    lesson.button_link = request.form.get('cta_url') if has_button else None
    lesson.button_delay = _parse_int(request.form.get('cta_delay'))

    _handle_document_uploads(request, lesson)

    db.session.commit()
    return jsonify({
        'success': True,
        'lesson': _serialize_lesson(lesson),
    })


@lessons_bp.route('/lessons/<int:lesson_id>', methods=['DELETE'])
@admin_required
def delete_lesson(lesson_id):
    """Delete a lesson and all related data."""
    try:
        lesson = Lesson.query.get_or_404(lesson_id)

        for faq in FAQ.query.filter_by(lesson_id=lesson_id).all():
            db.session.delete(faq)

        transcript = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        if transcript:
            db.session.delete(transcript)

        for doc in lesson.documents[:]:
            _delete_file(doc.filename)
            db.session.delete(doc)

        db.session.delete(lesson)
        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        print(f"Erro ao deletar aula: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar aula'}), 500


@lessons_bp.route('/lessons/reorder', methods=['POST'])
@admin_required
def reorder_lessons():
    """Reorder lessons by providing an ordered list of IDs."""
    data = request.get_json()
    new_order = data.get('order', [])
    for index, lesson_id in enumerate(new_order, start=1):
        lesson = Lesson.query.get(lesson_id)
        if lesson:
            lesson.order = index
    db.session.commit()
    return jsonify({'success': True})


@lessons_bp.route('/lessons/<int:lesson_id>/files/<int:file_id>', methods=['DELETE'])
@admin_required
def delete_lesson_file(lesson_id, file_id):
    """Delete a single file from a lesson."""
    document = Document.query.get_or_404(file_id)
    if document.lesson_id != lesson_id:
        return jsonify({'success': False, 'message': 'Arquivo não pertence a esta aula'}), 400

    try:
        _delete_file(document.filename)
        db.session.delete(document)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro: {str(e)}'}), 500


# ---- Helpers ----

def _parse_int(value):
    """Parse string to int, return None if invalid."""
    if value and str(value).strip():
        try:
            return int(value)
        except ValueError:
            return None
    return None


def _delete_file(filename):
    """Safely delete a file from uploads."""
    try:
        path = os.path.join('static/uploads', filename)
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


def _handle_document_uploads(req, lesson):
    """Process document file uploads for a lesson."""
    documents = req.files.getlist('documents')
    for doc in documents:
        if doc and doc.filename:
            ensure_upload_directory()
            filename = secure_filename(
                f"doc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{doc.filename}"
            )
            doc.save(os.path.join('static/uploads', filename))
            new_doc = Document(filename=filename, lesson=lesson)
            db.session.add(new_doc)


def _serialize_lesson(lesson):
    """Serialize a lesson to dict."""
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
        } for doc in lesson.documents],
    }
