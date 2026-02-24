"""
FAQ AI Routes — Geração de FAQs com IA usando transcrições.

Endpoints:
- POST /api/faq/ai/generate → Gera FAQs para uma aula
"""

import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps

from models import Admin, LessonTranscript, Lesson, Module, Course
from db.database import db
from db.integration_helpers import get_ai_api_key
from ai.models.faq import FaqAI
from ai.tools.youtube_transcript import YouTubeTranscriptTool

logger = logging.getLogger("routes.faq.ai")

ai_bp = Blueprint('faq_ai', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@ai_bp.route('/ai/generate', methods=['POST'])
@admin_required
def generate_faq():
    """
    Gera FAQs para uma aula usando IA.
    
    Body JSON:
    - lesson_id: ID da aula
    - provider: 'gemini' ou 'openai'
    - model: Nome do modelo
    - num_questions: Número de perguntas (opcional, padrão 5)
    """
    data = request.get_json()
    lesson_id = data.get('lesson_id')
    provider = data.get('provider')
    model = data.get('model')
    num_questions = data.get('num_questions', 5)

    if not lesson_id or not provider or not model:
        return jsonify({
            'success': False,
            'message': 'lesson_id, provider e model são obrigatórios'
        }), 400

    # Verificar se o provider está configurado
    api_key = get_ai_api_key(provider)
    if not api_key:
        return jsonify({
            'success': False,
            'message': f'API do {provider} não está configurada. Configure em Configurações > IA.'
        }), 400

    # Buscar a aula
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'success': False, 'message': 'Aula não encontrada'}), 404

    module = Module.query.get(lesson.module_id)
    course = Course.query.get(module.course_id) if module else None

    if not module or not course:
        return jsonify({'success': False, 'message': 'Módulo ou curso não encontrado'}), 404

    # Buscar ou gerar transcrição
    try:
        transcript_text = _get_or_fetch_transcript(lesson, module, course)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    # Gerar FAQ com IA
    try:
        faqs = FaqAI.generate_faqs(
            transcript_text=transcript_text,
            lesson_title=lesson.title,
            module_name=module.name,
            course_name=course.name,
            provider=provider,
            api_key=api_key,
            model=model,
            num_questions=num_questions,
        )

        return jsonify({
            'success': True,
            'faqs': faqs,
            'message': f'{len(faqs)} perguntas geradas com sucesso',
        })

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except RuntimeError as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Erro inesperado ao gerar FAQ: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno ao gerar FAQ'}), 500





def _get_or_fetch_transcript(lesson: Lesson, module: Module, course: Course) -> str:
    """
    Obtém transcrição do banco ou gera via YouTube transcript API.
    
    Se a transcrição já existe no banco, usa ela.
    Se não existe e o vídeo é do YouTube, busca e salva no banco.
    """
    # Verificar se já existe transcrição no banco
    existing = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()
    if existing and existing.transcript_text:
        logger.info(f"Usando transcrição existente para aula {lesson.id}")
        return existing.transcript_text

    # Verificar se é vídeo do YouTube
    video_url = lesson.video_url
    if not video_url or not YouTubeTranscriptTool.is_youtube_url(video_url):
        raise ValueError(
            "Esta aula não possui transcrição nem vídeo do YouTube. "
            "Adicione uma transcrição manualmente ou configure um vídeo do YouTube."
        )

    # Buscar transcrição do YouTube
    logger.info(f"Buscando transcrição do YouTube para aula {lesson.id}")
    result = YouTubeTranscriptTool.fetch_transcript(video_url)

    # Salvar no banco para uso futuro
    transcript = LessonTranscript(
        lesson_id=lesson.id,
        lesson_title=lesson.title,
        module_id=module.id,
        module_name=module.name,
        course_id=course.id,
        course_name=course.name,
        video_url=video_url,
        transcript_text=result["text"],
        transcription_provider="youtube_transcript_api",
        language=result.get("language_code", "pt-BR"),
        duration_seconds=result.get("duration_seconds"),
        word_count=result.get("word_count"),
    )
    db.session.add(transcript)
    db.session.commit()

    logger.info(f"Transcrição salva no banco para aula {lesson.id}")
    return result["text"]
