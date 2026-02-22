"""
transcript_sync — Auto-importação de transcrição do YouTube ao criar/editar aulas.

Busca a transcrição automaticamente quando a aula possui um vídeo do YouTube
e salva no banco como LessonTranscript.
"""

import logging
from models import Lesson, Module, Course, LessonTranscript
from db.database import db
from ai.tools.youtube_transcript import YouTubeTranscriptTool

logger = logging.getLogger("routes.course_modification.transcript_sync")


def auto_fetch_transcript(lesson_id: int) -> dict:
    """
    Tenta buscar e salvar a transcrição do YouTube para uma lesson.

    Retorna um dict com:
    - success: bool
    - message: str (mensagem descritiva)
    - word_count: int | None
    """
    try:
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return {"success": False, "message": "Aula não encontrada"}

        video_url = lesson.video_url
        if not video_url or not YouTubeTranscriptTool.is_youtube_url(video_url):
            return {"success": False, "message": "Vídeo não é do YouTube"}

        # Verificar se já existe transcrição
        existing = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        if existing:
            return {"success": False, "message": "Transcrição já existe para esta aula"}

        # Resolver hierarquia (module -> course)
        module = Module.query.get(lesson.module_id)
        if not module:
            return {"success": False, "message": "Módulo não encontrado"}

        course = Course.query.get(module.course_id)
        if not course:
            return {"success": False, "message": "Curso não encontrado"}

        # Buscar transcrição do YouTube
        yt_result = YouTubeTranscriptTool.fetch_transcript(video_url)
        transcript_text = yt_result.get("text", "")

        if not transcript_text:
            return {"success": False, "message": "Transcrição vazia retornada pelo YouTube"}

        # Criar LessonTranscript no banco
        transcript = LessonTranscript(
            lesson_id=lesson_id,
            lesson_title=lesson.title,
            module_id=module.id,
            module_name=module.name,
            course_id=course.id,
            course_name=course.name,
            video_url=video_url,
            transcript_text=transcript_text,
            transcription_provider="youtube_transcript_api",
            language=yt_result.get("language_code", "pt-BR"),
            duration_seconds=yt_result.get("duration_seconds"),
            word_count=yt_result.get("word_count", len(transcript_text.split())),
        )

        db.session.add(transcript)
        db.session.commit()

        logger.info(
            f"Transcrição auto-importada: lesson={lesson_id}, "
            f"palavras={transcript.word_count}"
        )

        return {
            "success": True,
            "message": "Transcrição importada automaticamente do YouTube",
            "word_count": transcript.word_count,
        }

    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        logger.warning(f"Falha ao auto-importar transcrição para lesson={lesson_id}: {error_msg}")
        return {"success": False, "message": f"Falha ao importar transcrição: {error_msg}"}
