from flask import Blueprint, request, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, LessonTranscript, Lesson, Module, Course
from sqlalchemy import func
from datetime import datetime
import logging

logger = logging.getLogger("transcripts.crud")

crud_bp = Blueprint('transcripts_crud', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def serialize_transcript(t):
    """Serialize a transcript for API response."""
    keywords = [k.strip() for k in (t.searchable_keywords or '').split(',') if k.strip()]
    return {
        'id': t.id,
        'lessonId': t.lesson_id,
        'lessonName': t.lesson_title,
        'moduleId': t.module_id,
        'moduleName': t.module_name,
        'courseId': t.course_id,
        'courseName': t.course_name,
        'text': t.transcript_text or '',
        'vector': t.transcript_vector or '',
        'keywords': keywords,
        'wordCount': t.word_count or (len(t.transcript_text.split()) if t.transcript_text else 0),
        'createdAt': t.created_at.strftime('%d/%m/%Y %H:%M') if t.created_at else None,
        'updatedAt': t.updated_at.strftime('%d/%m/%Y %H:%M') if t.updated_at else None,
    }


@crud_bp.route('/groups', methods=['GET'])
@admin_required
def get_transcript_groups():
    """Get all transcripts organized for drill-down (course > module > lesson)."""
    try:
        transcripts = LessonTranscript.query.order_by(
            LessonTranscript.course_name,
            LessonTranscript.module_name,
            LessonTranscript.lesson_title
        ).all()

        return jsonify([serialize_transcript(t) for t in transcripts])
    except Exception as e:
        logger.error(f"Erro ao buscar transcrições: {str(e)}")
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/lesson/<int:lesson_id>', methods=['GET'])
@admin_required
def get_lesson_transcript(lesson_id):
    """Get transcript for a specific lesson."""
    try:
        t = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        if not t:
            return jsonify({'error': 'Transcrição não encontrada'}), 404

        return jsonify(serialize_transcript(t))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/create', methods=['POST'])
@admin_required
def create_transcript():
    """Create a transcript for a lesson."""
    try:
        data = request.get_json()
        lesson_id = data.get('lessonId')
        text = data.get('text', '')
        vector = data.get('vector', '')
        keywords = data.get('keywords', [])

        if not lesson_id:
            return jsonify({'success': False, 'message': 'Aula não informada'}), 400

        # Check if lesson exists
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'message': 'Aula não encontrada'}), 404

        # Check if lesson already has transcript
        existing = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Esta aula já possui transcrição. Edite a existente.'
            }), 400

        # Resolve hierarchy
        module = Module.query.get(lesson.module_id)
        if not module:
            return jsonify({'success': False, 'message': 'Módulo não encontrado'}), 404

        course = Course.query.get(module.course_id)
        if not course:
            return jsonify({'success': False, 'message': 'Curso não encontrado'}), 404

        transcript = LessonTranscript(
            lesson_id=lesson_id,
            lesson_title=lesson.title,
            module_id=module.id,
            module_name=module.name,
            course_id=course.id,
            course_name=course.name,
            transcript_text=text,
            transcript_vector=vector,
            searchable_keywords=', '.join(keywords) if keywords else '',
            word_count=len(text.split()) if text else 0,
        )

        db.session.add(transcript)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Transcrição criada com sucesso',
            'item': serialize_transcript(transcript),
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar transcrição: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/update/<int:transcript_id>', methods=['PUT'])
@admin_required
def update_transcript(transcript_id):
    """Update an existing transcript."""
    try:
        data = request.get_json()
        transcript = LessonTranscript.query.get(transcript_id)

        if not transcript:
            return jsonify({'success': False, 'message': 'Transcrição não encontrada'}), 404

        text = data.get('text', transcript.transcript_text)
        vector = data.get('vector', transcript.transcript_vector)
        keywords = data.get('keywords')

        transcript.transcript_text = text
        transcript.transcript_vector = vector
        transcript.word_count = len(text.split()) if text else 0
        transcript.updated_at = datetime.utcnow()

        if keywords is not None:
            transcript.searchable_keywords = ', '.join(keywords)

        # Refresh hierarchy names in case they changed
        lesson = Lesson.query.get(transcript.lesson_id)
        if lesson:
            transcript.lesson_title = lesson.title
            module = Module.query.get(lesson.module_id)
            if module:
                transcript.module_name = module.name
                course = Course.query.get(module.course_id)
                if course:
                    transcript.course_name = course.name

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Transcrição atualizada com sucesso',
            'item': serialize_transcript(transcript),
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar transcrição: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/<int:transcript_id>', methods=['DELETE'])
@admin_required
def delete_transcript(transcript_id):
    """Delete a transcript."""
    try:
        transcript = LessonTranscript.query.get(transcript_id)
        if not transcript:
            return jsonify({'success': False, 'message': 'Transcrição não encontrada'}), 404

        db.session.delete(transcript)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Transcrição excluída com sucesso'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir transcrição: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
