import logging
import concurrent.futures
from flask import Blueprint, request, jsonify, session
from functools import wraps

from models import Admin, Lesson, Module, Course, LessonTranscript, FAQ
from db.database import db
from db.integration_helpers import get_ai_api_key, get_integration
from ai.models.transcript_metadata import TranscriptMetadataAI
from ai.models.faq import FaqAI
from ai.models.lesson_description import LessonDescriptionAI
from ai.tools.youtube_transcript import YouTubeTranscriptTool
from ai.tools.assemblyai_transcript import AssemblyAITranscriptTool

logger = logging.getLogger("routes.course_modification.auto_fill")

auto_fill_bp = Blueprint("course_mod_auto_fill", __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session or session.get("user_type") != "admin":
            return jsonify({"error": "Unauthorized"}), 401
        if not Admin.query.get(session["user_id"]):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


@auto_fill_bp.route("/courses/<int:course_id>/auto-fill-status", methods=["GET"])
@admin_required
def get_auto_fill_status(course_id):
    """
    Retorna o status de pré-voo para a funcionalidade Auto-Fill.

    Retorna:
      - config: Status das configurações necessárias (AI, AssemblyAI)
      - lessons: Lista com status detalhado de cada aula
        - hasTranscript: bool
        - hasDescription: bool
        - hasFaq: bool
        - videoType: 'youtube' | 'cloudflare' | 'vturb' | 'custom' | null
        - canProcess: bool (YouTube ou Cloudflare — suporta transcrição)
        - needsAction: bool (canProcess AND não tem descrição)
        - skipReason: string ou null
    """
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"success": False, "message": "Curso não encontrado"}), 404

    # ── Config checks ──
    ai_configured = bool(get_ai_api_key("gemini") or get_ai_api_key("openai"))
    aai_enabled, aai_cfg = get_integration("assemblyai")
    assemblyai_configured = bool(aai_enabled and aai_cfg.get("api_key"))

    # ── Lesson status ──
    modules = Module.query.filter_by(course_id=course_id).order_by(Module.order).all()
    lessons_status = []

    for module in modules:
        lessons = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order).all()
        for lesson in lessons:
            transcript = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()
            faq_count = FAQ.query.filter_by(lesson_id=lesson.id).count()

            has_transcript = bool(transcript and transcript.transcript_text)
            has_description = bool(lesson.description and lesson.description.strip())
            has_faq = faq_count > 0

            video_type = lesson.video_type or "custom"
            video_url = lesson.video_url or ""

            # Determine platform from URL if video_type not set
            is_youtube = (
                video_type == "youtube"
                or YouTubeTranscriptTool.is_youtube_url(video_url)
            )
            is_cloudflare = video_type == "cloudflare"
            can_process = is_youtube or is_cloudflare

            # Needs AssemblyAI only for Cloudflare
            needs_assemblyai = is_cloudflare and not has_transcript
            assemblyai_ok = assemblyai_configured or not needs_assemblyai

            # Skip reason priority
            skip_reason = None
            if has_description:
                skip_reason = "Descrição já existe"
            elif not can_process:
                skip_reason = "VTurb/Custom não suporta transcrição automática"
            elif needs_assemblyai and not assemblyai_configured:
                skip_reason = "AssemblyAI não configurada"

            needs_action = can_process and not has_description and assemblyai_ok

            lessons_status.append({
                "lessonId": lesson.id,
                "lessonTitle": lesson.title,
                "moduleId": module.id,
                "moduleName": module.name,
                "videoType": video_type,
                "videoUrl": video_url,
                "isYoutube": is_youtube,
                "isCloudflare": is_cloudflare,
                "hasTranscript": has_transcript,
                "hasDescription": has_description,
                "hasFaq": has_faq,
                "canProcess": can_process,
                "needsAssemblyAI": needs_assemblyai,
                "assemblyAIOk": assemblyai_ok,
                "needsAction": needs_action,
                "skipReason": skip_reason,
            })

    processable = [l for l in lessons_status if l["needsAction"]]
    skipped_has_desc = [l for l in lessons_status if l["hasDescription"]]
    blocked = [l for l in lessons_status if not l["needsAction"] and not l["hasDescription"]]

    return jsonify({
        "success": True,
        "config": {
            "aiConfigured": ai_configured,
            "assemblyAIConfigured": assemblyai_configured,
        },
        "summary": {
            "total": len(lessons_status),
            "processable": len(processable),
            "skippedHasDescription": len(skipped_has_desc),
            "blocked": len(blocked),
        },
        "lessons": lessons_status,
    })


@auto_fill_bp.route("/lessons/<int:lesson_id>/auto-fill", methods=["POST"])
@admin_required
def auto_fill_lesson(lesson_id):
    """
    Preenche automaticamente todas as informações de uma aula com IA.

    Body JSON (opcional):
      - provider: 'gemini' (padrão) ou 'openai'
      - model: Nome do modelo
      - num_questions: Número de FAQs a gerar (padrão: 5)
      - skip_if_exists: Se true, pula etapas já feitas (padrão: true)

    Retorna:
      - steps: Status de cada etapa (transcript, metadata, faq, description)
      - errors: Lista de erros que ocorreram (etapas puladas não param o fluxo)
    """
    data = request.get_json() or {}
    provider = data.get("provider", "gemini")
    model = data.get("model")
    num_questions = int(data.get("num_questions", 5))
    skip_if_exists = data.get("skip_if_exists", True)

    # ── Validate AI config ──
    api_key = get_ai_api_key(provider)
    if not api_key:
        return jsonify({
            "success": False,
            "message": f"API do {provider} não está configurada. Configure em Configurações → IA.",
        }), 400

    # ── Load lesson context ──
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({"success": False, "message": "Aula não encontrada"}), 404

    module = Module.query.get(lesson.module_id)
    course = Course.query.get(module.course_id) if module else None
    if not module or not course:
        return jsonify({"success": False, "message": "Módulo ou curso não encontrado"}), 404

    steps = {}
    errors = []

    # ── STEP 1: Get or generate transcript ──
    transcript = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
    transcript_text = transcript.transcript_text if transcript else None

    if not transcript_text:
        steps["transcript"] = "generating"
        video_url = lesson.video_url

        if not video_url:
            return jsonify({
                "success": False,
                "message": f'Aula "{lesson.title}" não possui vídeo configurado.',
                "steps": steps,
            }), 400

        try:
            if YouTubeTranscriptTool.is_youtube_url(video_url):
                result = YouTubeTranscriptTool.fetch_transcript(video_url)
                provider_name = "youtube_transcript_api"
                transcript_text = result["text"]
                language = result.get("language_code", "pt-BR")
                duration_seconds = result.get("duration_seconds")
                word_count = result.get("word_count")

            elif lesson.video_type == "cloudflare":
                aai_enabled, aai_cfg = get_integration("assemblyai")
                aai_key = aai_cfg.get("api_key") if aai_enabled else None
                if not aai_key:
                    return jsonify({
                        "success": False,
                        "message": "AssemblyAI não configurada. Habilite em Configurações → Integrações.",
                        "steps": steps,
                    }), 400
                result = AssemblyAITranscriptTool.transcribe(video_url, aai_key)
                provider_name = "assemblyai"
                transcript_text = result["text"]
                language = result.get("language_code", "pt-BR")
                duration_seconds = result.get("duration_seconds")
                word_count = result.get("word_count")

            else:
                return jsonify({
                    "success": False,
                    "message": (
                        "Tipo de vídeo não suportado para transcrição automática. "
                        "Suporte: YouTube e Cloudflare R2. VTurb não tem transcrição."
                    ),
                    "steps": steps,
                }), 400

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
                    transcription_provider=provider_name,
                    language=language,
                    duration_seconds=duration_seconds,
                    word_count=word_count,
                )
                db.session.add(transcript)
            else:
                transcript.transcript_text = transcript_text

            db.session.commit()
            steps["transcript"] = "done"

        except Exception as e:
            logger.error(f"Erro ao obter transcrição para aula {lesson_id}: {e}")
            return jsonify({
                "success": False,
                "message": f"Erro ao obter transcrição: {str(e)}",
                "steps": {"transcript": "error"},
            }), 500

    else:
        steps["transcript"] = "skipped_existing"

    # ── STEP 2: Parallel tasks (metadata + FAQ + description) ──
    ctx_args = {
        "transcript_text": transcript_text,
        "lesson_title": lesson.title,
        "module_name": module.name,
        "course_name": course.name,
        "provider": provider,
        "api_key": api_key,
        "model": model,
    }

    # Check existing data (respect skip_if_exists)
    has_metadata = bool(transcript and transcript.transcript_vector)
    has_faq = FAQ.query.filter_by(lesson_id=lesson_id).count() > 0
    has_description = bool(lesson.description and lesson.description.strip())

    metadata_result = {}
    faq_result = []
    description_result = ""

    def _gen_metadata():
        if skip_if_exists and has_metadata:
            return "skipped"
        meta = TranscriptMetadataAI.generate_metadata(
            transcript_text=ctx_args["transcript_text"],
            provider=ctx_args["provider"],
            api_key=ctx_args["api_key"],
            model=ctx_args["model"],
        )
        return meta

    def _gen_faq():
        if skip_if_exists and has_faq:
            return "skipped"
        faqs = FaqAI.generate_faqs(
            transcript_text=ctx_args["transcript_text"],
            lesson_title=ctx_args["lesson_title"],
            module_name=ctx_args["module_name"],
            course_name=ctx_args["course_name"],
            provider=ctx_args["provider"],
            api_key=ctx_args["api_key"],
            model=ctx_args["model"],
            num_questions=num_questions,
        )
        return faqs

    def _gen_description():
        if skip_if_exists and has_description:
            return "skipped"
        desc = LessonDescriptionAI.generate_description(
            transcript_text=ctx_args["transcript_text"],
            lesson_title=ctx_args["lesson_title"],
            module_name=ctx_args["module_name"],
            course_name=ctx_args["course_name"],
            provider=ctx_args["provider"],
            api_key=ctx_args["api_key"],
            model=ctx_args["model"],
        )
        return desc

    # Run in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        fut_meta = executor.submit(_gen_metadata)
        fut_faq = executor.submit(_gen_faq)
        fut_desc = executor.submit(_gen_description)

        # Collect metadata
        try:
            metadata_result = fut_meta.result()
            if metadata_result == "skipped":
                steps["metadata"] = "skipped_existing"
                metadata_result = {}
            else:
                steps["metadata"] = "done"
        except Exception as e:
            logger.error(f"Erro ao gerar metadados para aula {lesson_id}: {e}")
            errors.append(f"Metadados: {str(e)}")
            steps["metadata"] = "error"

        # Collect FAQs
        try:
            faq_result = fut_faq.result()
            if faq_result == "skipped":
                steps["faq"] = "skipped_existing"
                faq_result = []
            else:
                steps["faq"] = "done"
        except Exception as e:
            logger.error(f"Erro ao gerar FAQ para aula {lesson_id}: {e}")
            errors.append(f"FAQ: {str(e)}")
            steps["faq"] = "error"

        # Collect description
        try:
            description_result = fut_desc.result()
            if description_result == "skipped":
                steps["description"] = "skipped_existing"
                description_result = ""
            else:
                steps["description"] = "done"
        except Exception as e:
            logger.error(f"Erro ao gerar descrição para aula {lesson_id}: {e}")
            errors.append(f"Descrição: {str(e)}")
            steps["description"] = "error"

    # ── STEP 3: Persist results ──
    try:
        # Update transcript metadata
        if metadata_result and isinstance(metadata_result, dict):
            if transcript:
                transcript.transcript_vector = metadata_result.get("summary", "")
                transcript.searchable_keywords = metadata_result.get("keywords", "")
                if not transcript.word_count:
                    transcript.word_count = len(transcript_text.split())

        # Save FAQs
        if faq_result and isinstance(faq_result, list) and len(faq_result) > 0:
            # Clear existing and replace
            FAQ.query.filter_by(lesson_id=lesson_id).delete()
            for order, item in enumerate(faq_result, start=1):
                faq = FAQ(
                    lesson_id=lesson_id,
                    question=item["question"],
                    answer=item["answer"],
                    order=order,
                )
                db.session.add(faq)

        # Save description
        if description_result and isinstance(description_result, str):
            lesson.description = description_result

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao persistir dados da auto-fill para aula {lesson_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Erro ao salvar dados gerados: {str(e)}",
            "steps": steps,
            "errors": errors,
        }), 500

    return jsonify({
        "success": True,
        "lessonId": lesson_id,
        "lessonTitle": lesson.title,
        "steps": steps,
        "errors": errors,
        "message": _build_success_message(steps),
        "description": description_result or "",
        "faqCount": len(faq_result) if isinstance(faq_result, list) else 0,
    })


def _build_success_message(steps: dict) -> str:
    """Monta mensagem de sucesso baseada no que foi gerado."""
    done = [k for k, v in steps.items() if v == "done"]
    labels = {
        "transcript": "transcrição",
        "metadata": "resumo/keywords",
        "faq": "FAQ",
        "description": "descrição",
    }
    if not done:
        return "Nenhuma nova informação foi gerada (tudo já existia)."
    generated = ", ".join(labels.get(k, k) for k in done)
    return f"Gerado com sucesso: {generated}."
