"""
Transcripts AI Routes — Geração de metadados e transcrições automáticas com IA.

Endpoints:
- GET  /api/transcripts/pending-lessons    → Lista aulas sem transcrição/resumo/keywords
- POST /api/transcripts/generate-metadata  → Gera keywords e resumo para uma transcrição
- POST /api/transcripts/auto-generate      → Gera transcrição + metadados em batch
- POST /api/transcripts/youtube-transcript → Busca transcrição do YouTube por lessonId
"""

import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps

from models import Admin, LessonTranscript, Lesson, Module, Course
from db.database import db
from db.integration_helpers import get_ai_api_key
from ai.models.transcript_metadata import TranscriptMetadataAI
from ai.tools.youtube_transcript import YouTubeTranscriptTool
from ai.tools.assemblyai_transcript import AssemblyAITranscriptTool

logger = logging.getLogger("routes.transcripts.ai")

ai_bp = Blueprint('transcripts_ai', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function





@ai_bp.route('/pending-lessons', methods=['GET'])
@admin_required
def get_pending_lessons():
    """Lista todas as aulas com status de transcrição, resumo e keywords."""
    try:
        lessons = (
            Lesson.query
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .order_by(Course.name, Module.order, Lesson.order)
            .all()
        )

        result = []
        for lesson in lessons:
            module = Module.query.get(lesson.module_id)
            course = Course.query.get(module.course_id) if module else None
            if not module or not course:
                continue

            transcript = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()

            has_transcript = bool(transcript and transcript.transcript_text)
            has_summary = bool(transcript and transcript.transcript_vector)
            has_keywords = bool(transcript and transcript.searchable_keywords)
            is_youtube = bool(lesson.video_url and YouTubeTranscriptTool.is_youtube_url(lesson.video_url or ''))
            is_telegram = lesson.video_type == 'telegram'

            result.append({
                'lessonId': lesson.id,
                'lessonName': lesson.title,
                'moduleId': module.id,
                'moduleName': module.name,
                'courseId': course.id,
                'courseName': course.name,
                'hasTranscript': has_transcript,
                'hasSummary': has_summary,
                'hasKeywords': has_keywords,
                'isYoutube': is_youtube,
                'isTelegram': is_telegram,
                'videoUrl': lesson.video_url or '',
            })

        return jsonify(result)
    except Exception as e:
        logger.error(f"Erro ao buscar aulas pendentes: {str(e)}")
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/generate-metadata', methods=['POST'])
@admin_required
def generate_metadata():
    """Gera metadados (keywords e resumo) de uma transcrição usando IA."""
    try:
        data = request.get_json()
        transcript_text = data.get('text', '')
        provider = data.get('provider', 'gemini')
        model = data.get('model')

        if not transcript_text:
            return jsonify({
                'success': False,
                'message': 'Texto da transcrição não fornecido'
            }), 400


        api_key = get_ai_api_key(provider)
        if not api_key:
            return jsonify({
                'success': False,
                'message': f'API do {provider} não está configurada'
            }), 400

        result = TranscriptMetadataAI.generate_metadata(
            transcript_text=transcript_text,
            provider=provider,
            api_key=api_key,
            model=model,
        )

        return jsonify({
            'success': True,
            'keywords': result.get('keywords', ''),
            'summary': result.get('summary', ''),
        })

    except Exception as e:
        logger.error(f"Erro ao gerar metadados: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@ai_bp.route('/auto-generate', methods=['POST'])
@admin_required
def auto_generate():
    """
    Gera transcrição + metadados automaticamente para uma aula específica.

    Body JSON:
    - lessonId: ID da aula
    - provider: 'gemini' ou 'openai'
    - model: Nome do modelo para metadados
    """
    try:
        data = request.get_json()
        lesson_id = data.get('lessonId')
        provider = data.get('provider', 'gemini')
        model = data.get('model')

        if not lesson_id:
            return jsonify({'success': False, 'message': 'lessonId obrigatório'}), 400

        api_key = get_ai_api_key(provider)
        if not api_key:
            return jsonify({
                'success': False,
                'message': f'API do {provider} não está configurada'
            }), 400

        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'message': 'Aula não encontrada'}), 404

        module = Module.query.get(lesson.module_id)
        course = Course.query.get(module.course_id) if module else None
        if not module or not course:
            return jsonify({'success': False, 'message': 'Módulo ou curso não encontrado'}), 404

        # 1. Obter ou criar transcrição
        transcript = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        transcript_text = transcript.transcript_text if transcript else None

        # Se não tem transcrição, buscar do YouTube ou AssemblyAI (Telegram)
        if not transcript_text:
            if lesson.video_type == 'telegram':
                yt_result = AssemblyAITranscriptTool.fetch_transcript(lesson)
                transcription_provider = 'assemblyai'
                video_url = lesson.video_url
            else:
                video_url = lesson.video_url
                if not video_url or not YouTubeTranscriptTool.is_youtube_url(video_url):
                    return jsonify({
                        'success': False,
                        'message': f'Aula "{lesson.title}" não possui vídeo suportado (YouTube ou Telegram).'
                    }), 400

                yt_result = YouTubeTranscriptTool.fetch_transcript(video_url)
                transcription_provider = 'youtube_transcript_api'

            transcript_text = yt_result['text']

            if not transcript:
                transcript = LessonTranscript(
                    lesson_id=lesson_id,
                    lesson_title=lesson.title,
                    module_id=module.id,
                    module_name=module.name,
                    course_id=course.id,
                    course_name=course.name,
                    video_url=video_url,
                    transcript_text=transcript_text,
                    transcription_provider=transcription_provider,
                    language=yt_result.get('language_code', 'pt-BR'),
                    duration_seconds=yt_result.get('duration_seconds'),
                    word_count=yt_result.get('word_count'),
                )
                db.session.add(transcript)
            else:
                transcript.transcript_text = transcript_text
                transcript.word_count = yt_result.get('word_count')

        # 2. Gerar metadados com IA (resumo + keywords)
        metadata = TranscriptMetadataAI.generate_metadata(
            transcript_text=transcript_text,
            provider=provider,
            api_key=api_key,
            model=model,
        )

        transcript.transcript_vector = metadata.get('summary', '')
        transcript.searchable_keywords = metadata.get('keywords', '')
        if not transcript.word_count:
            transcript.word_count = len(transcript_text.split()) if transcript_text else 0

        db.session.commit()

        logger.info(f"Auto-geração concluída para aula {lesson_id}")

        return jsonify({
            'success': True,
            'lessonId': lesson_id,
            'message': f'Transcrição e metadados gerados para "{lesson.title}"',
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro na auto-geração para aula {data.get('lessonId')}: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@ai_bp.route('/youtube-transcript', methods=['POST'])
@admin_required
def fetch_youtube_transcript():
    """
    Busca a transcrição do YouTube para uma aula.

    Body JSON:
    - lessonId: ID da aula
    """
    try:
        data = request.get_json()
        lesson_id = data.get('lessonId')

        if not lesson_id:
            return jsonify({'success': False, 'message': 'lessonId obrigatório'}), 400

        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'message': 'Aula não encontrada'}), 404

        if lesson.video_type == 'telegram':
            result = AssemblyAITranscriptTool.fetch_transcript(lesson)
        else:
            video_url = lesson.video_url
            if not video_url or not YouTubeTranscriptTool.is_youtube_url(video_url):
                return jsonify({
                    'success': False,
                    'message': 'Esta aula não possui vídeo suportado (YouTube ou Telegram).'
                }), 400
            result = YouTubeTranscriptTool.fetch_transcript(video_url)

        return jsonify({
            'success': True,
            'text': result['text'],
            'srt': result.get('srt', ''),
            'wordCount': result.get('word_count', 0),
            'language': result.get('language_code', 'pt-BR'),
            'captionId': result.get('caption_id', ''),
            'isAutoSynced': result.get('is_auto_synced', False),
        })

    except Exception as e:
        logger.error(f"Erro ao buscar transcrição do YouTube: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

