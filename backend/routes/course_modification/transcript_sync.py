"""
transcript_sync — Auto-importação de transcrição ao criar/editar aulas.

- Vídeos do YouTube: usa a YouTube Data API v3 (captions oficiais).
- Vídeos do Cloudflare R2 (video_type='cloudflare'): submete a URL pública
  para a AssemblyAI; ela baixa o vídeo direto do R2.
"""

import logging
import threading

from flask import current_app

from models import Lesson, Module, Course, LessonTranscript
from db.database import db
from db.integration_helpers import get_integration
from ai.tools.youtube_transcript import YouTubeTranscriptTool
from ai.tools.assemblyai_transcript import AssemblyAITranscriptTool

logger = logging.getLogger("routes.course_modification.transcript_sync")


def auto_fetch_transcript(lesson_id: int) -> dict:
    """
    Tenta buscar e salvar a transcrição para uma lesson.

    Para YouTube → busca síncrona (rápida).
    Para Cloudflare → dispara em background (AssemblyAI pode levar minutos).

    Retorna um dict com:
    - success: bool
    - message: str
    - word_count: int | None
    """
    try:
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return {"success": False, "message": "Aula não encontrada"}

        video_url = lesson.video_url
        if not video_url:
            return {"success": False, "message": "Aula sem vídeo"}

        # Skip if a transcript already exists for this lesson
        if LessonTranscript.query.filter_by(lesson_id=lesson_id).first():
            return {"success": False, "message": "Transcrição já existe para esta aula"}

        module = Module.query.get(lesson.module_id)
        if not module:
            return {"success": False, "message": "Módulo não encontrado"}

        course = Course.query.get(module.course_id)
        if not course:
            return {"success": False, "message": "Curso não encontrado"}

        # ── YouTube ────────────────────────────────────────────────
        if YouTubeTranscriptTool.is_youtube_url(video_url):
            return _fetch_youtube(lesson, module, course, video_url)

        # ── Cloudflare R2 (or any direct video URL) ────────────────
        if lesson.video_type == 'cloudflare':
            return _start_assemblyai_background(lesson_id, current_app._get_current_object())

        return {"success": False, "message": "Tipo de vídeo não suporta transcrição automática"}

    except Exception as e:
        db.session.rollback()
        logger.warning(f"Falha ao auto-importar transcrição para lesson={lesson_id}: {e}")
        return {"success": False, "message": f"Falha ao importar transcrição: {e}"}


def _fetch_youtube(lesson: Lesson, module: Module, course: Course, video_url: str) -> dict:
    yt_result = YouTubeTranscriptTool.fetch_transcript(video_url)
    transcript_text = yt_result.get("text", "")
    if not transcript_text:
        return {"success": False, "message": "Transcrição vazia retornada pelo YouTube"}

    transcript = LessonTranscript(
        lesson_id=lesson.id,
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
    logger.info(f"YouTube transcript salvo: lesson={lesson.id}, words={transcript.word_count}")
    return {
        "success": True,
        "message": "Transcrição importada do YouTube",
        "word_count": transcript.word_count,
    }


def _start_assemblyai_background(lesson_id: int, app) -> dict:
    """Run AssemblyAI in a background thread — the job can take several minutes."""
    enabled, cfg = get_integration('assemblyai')
    api_key = cfg.get('api_key') if enabled else None
    if not api_key:
        return {"success": False, "message": "AssemblyAI não está configurada — pule esta etapa em Integrações."}

    def worker():
        with app.app_context():
            try:
                lesson = Lesson.query.get(lesson_id)
                if not lesson or not lesson.video_url:
                    return

                module = Module.query.get(lesson.module_id)
                course = Course.query.get(module.course_id) if module else None
                if not module or not course:
                    return

                if LessonTranscript.query.filter_by(lesson_id=lesson_id).first():
                    return

                result = AssemblyAITranscriptTool.transcribe(lesson.video_url, api_key)
                text = result.get("text", "")
                if not text:
                    logger.warning(f"AssemblyAI: transcrição vazia para lesson={lesson_id}")
                    return

                transcript = LessonTranscript(
                    lesson_id=lesson_id,
                    lesson_title=lesson.title,
                    module_id=module.id,
                    module_name=module.name,
                    course_id=course.id,
                    course_name=course.name,
                    video_url=lesson.video_url,
                    transcript_text=text,
                    transcription_provider="assemblyai",
                    language=result.get("language_code", "pt-BR"),
                    duration_seconds=result.get("duration_seconds"),
                    word_count=result.get("word_count", len(text.split())),
                )
                db.session.add(transcript)
                db.session.commit()
                logger.info(
                    f"AssemblyAI transcript salvo: lesson={lesson_id}, "
                    f"words={transcript.word_count}"
                )
            except Exception as e:
                db.session.rollback()
                logger.error(f"AssemblyAI falhou para lesson={lesson_id}: {e}")

    threading.Thread(target=worker, daemon=True).start()
    return {
        "success": True,
        "message": "Transcrição agendada (AssemblyAI) — em alguns minutos estará disponível.",
    }
