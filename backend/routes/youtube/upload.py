"""
YouTube Upload Routes — Handles video uploads via server-side proxy.

Flow:
1. Backend creates a resumable upload session (lightweight API call)
2. Browser uploads file to our proxy endpoint (nginx buffers efficiently)
3. Backend streams the buffered file to YouTube (fast server-to-server)
4. Backend saves video info to DB

This avoids CORS issues while keeping server CPU/RAM usage minimal
because nginx handles the slow client connection.

Endpoints:
- POST /api/youtube/upload          → Upload single video (proxy to YouTube)
- POST /api/youtube/upload/bulk     → Upload multiple videos (proxy to YouTube)
"""
import logging
import requests as http_requests
from flask import Blueprint, request, jsonify, session as flask_session
from functools import wraps
from db.database import db
from models import Admin, Lesson, Module
from db.integration_helpers import get_integration

logger = logging.getLogger("routes.youtube.upload")

youtube_upload_bp = Blueprint('youtube_upload', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in flask_session or flask_session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(flask_session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def _get_youtube_credentials():
    """Get stored YouTube OAuth credentials."""
    _, youtube = get_integration('youtube')

    if not youtube.get('refresh_token'):
        return None, "YouTube não está conectado."

    if not youtube.get('client_id') or not youtube.get('client_secret'):
        return None, "Credenciais YouTube não configuradas."

    return {
        "client_id": youtube['client_id'],
        "client_secret": youtube['client_secret'],
        "refresh_token": youtube['refresh_token'],
    }, None


def _get_youtube_service():
    """Get authenticated YouTube service from stored credentials."""
    from integrations.youtube.connection import get_youtube_service

    creds, error = _get_youtube_credentials()
    if error:
        return None, error

    try:
        service = get_youtube_service(
            client_id=creds["client_id"],
            client_secret=creds["client_secret"],
            refresh_token=creds["refresh_token"],
        )
        return service, None
    except Exception as e:
        logger.error(f"Erro ao criar serviço YouTube: {e}")
        return None, f"Erro de autenticação: {str(e)}"


def _create_session_and_upload(creds: dict, file_data: bytes, title: str, content_type: str) -> dict:
    """
    Create a resumable upload session on YouTube, then stream the file.
    Returns dict with video_id and video_url on success.
    """
    from integrations.youtube.resumable_session import create_resumable_upload_session

    # Step 1: Create resumable session (lightweight API call)
    session_result = create_resumable_upload_session(
        client_id=creds["client_id"],
        client_secret=creds["client_secret"],
        refresh_token=creds["refresh_token"],
        title=title,
    )

    if not session_result.get("success"):
        return {"success": False, "error": session_result.get("error", "Sessão falhou")}

    upload_url = session_result["upload_url"]

    # Step 2: Upload file to YouTube (fast server-to-server transfer)
    yt_response = http_requests.put(
        upload_url,
        data=file_data,
        headers={"Content-Type": content_type or "video/*"},
        timeout=600,
    )

    if yt_response.status_code not in (200, 201):
        logger.error(f"YouTube upload falhou: {yt_response.status_code} - {yt_response.text}")
        return {"success": False, "error": f"YouTube retornou status {yt_response.status_code}"}

    yt_data = yt_response.json()
    video_id = yt_data.get("id")

    if not video_id:
        return {"success": False, "error": "YouTube não retornou video ID"}

    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Upload concluído: {title} → {video_url}")

    return {
        "success": True,
        "video_id": video_id,
        "video_url": video_url,
    }


# ─── Single Upload ────────────────────────────────────────────────────
@youtube_upload_bp.route('/upload', methods=['POST'])
@admin_required
def upload_single():
    """
    Upload a single video to YouTube via server-side proxy.
    Nginx buffers the file, then we stream it to YouTube.

    Expects multipart form data:
    - video: File (the video file)
    - title: str (video title)
    - lesson_id: int (optional, lesson to associate)
    """
    creds, error = _get_youtube_credentials()
    if error:
        return jsonify({'success': False, 'message': error}), 400

    video_file = request.files.get('video')
    title = request.form.get('title', '').strip()

    if not video_file or not video_file.filename:
        return jsonify({'success': False, 'message': 'Nenhum vídeo enviado.'}), 400
    if not title:
        return jsonify({'success': False, 'message': 'Título é obrigatório.'}), 400

    try:
        file_data = video_file.read()
        content_type = video_file.content_type

        result = _create_session_and_upload(creds, file_data, title, content_type)

        if not result.get('success'):
            return jsonify({
                'success': False,
                'message': result.get('error', 'Upload falhou.'),
            }), 500

        # Associate with lesson if lesson_id provided
        lesson_id = request.form.get('lesson_id')
        if lesson_id:
            lesson = Lesson.query.get(int(lesson_id))
            if lesson:
                lesson.video_url = result['video_url']
                lesson.video_type = 'youtube'
                db.session.commit()

        return jsonify({
            'success': True,
            'video_id': result['video_id'],
            'video_url': result['video_url'],
            'message': f'Vídeo "{title}" enviado com sucesso!',
        })

    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        return jsonify({
            'success': False,
            'message': f'Erro no upload: {str(e)}',
        }), 500


# ─── Bulk Upload ──────────────────────────────────────────────────────
@youtube_upload_bp.route('/upload/bulk', methods=['POST'])
@admin_required
def upload_bulk():
    """
    Upload multiple videos to YouTube via server-side proxy.
    Creates lessons and playlist automatically.

    Expects multipart form data:
    - videos: File[] (multiple video files)
    - titles: str (JSON array of titles)
    - module_id: int (module to create lessons in)
    """
    import json
    import os
    from integrations.youtube.playlist import get_or_create_playlist, add_video_to_playlist

    creds, error = _get_youtube_credentials()
    if error:
        return jsonify({'success': False, 'message': error}), 400

    module_id = request.form.get('module_id')
    if not module_id:
        return jsonify({'success': False, 'message': 'module_id é obrigatório.'}), 400

    module = Module.query.get(int(module_id))
    if not module:
        return jsonify({'success': False, 'message': 'Módulo não encontrado.'}), 404

    videos = request.files.getlist('videos')
    titles_raw = request.form.get('titles', '[]')

    try:
        titles = json.loads(titles_raw)
    except json.JSONDecodeError:
        return jsonify({'success': False, 'message': 'Formato de títulos inválido.'}), 400

    if not videos:
        return jsonify({'success': False, 'message': 'Nenhum vídeo enviado.'}), 400

    # Get or create YouTube playlist
    service, _ = _get_youtube_service()
    playlist_id = None

    if service:
        try:
            course_name = module.course.name if module.course else ""
            playlist_description = f'Aulas do módulo "{module.name}"'
            if course_name:
                playlist_description += f" — Curso: {course_name}"

            playlist_id = get_or_create_playlist(
                youtube_service=service,
                title=module.name,
                description=playlist_description,
            )
            logger.info(f"Playlist para módulo '{module.name}': {playlist_id}")
        except Exception as e:
            logger.warning(f"Não foi possível criar/encontrar playlist: {e}")

    # Ensure titles match videos length
    while len(titles) < len(videos):
        idx = len(titles)
        fallback = videos[idx].filename or f"Aula {idx + 1}"
        fallback = os.path.splitext(fallback)[0]
        titles.append(fallback)

    results = []
    current_order = len(module.lessons) + 1

    for i, (video_file, title) in enumerate(zip(videos, titles)):
        title = title.strip() if title else f"Aula {current_order}"

        try:
            file_data = video_file.read()
            content_type = video_file.content_type

            upload_result = _create_session_and_upload(creds, file_data, title, content_type)

            if upload_result.get('success'):
                # Add video to playlist
                playlist_status = None
                if playlist_id and service:
                    try:
                        pl_result = add_video_to_playlist(
                            service, playlist_id, upload_result['video_id']
                        )
                        playlist_status = "added" if pl_result.get("success") else "failed"
                    except Exception as pl_err:
                        logger.warning(f"Erro ao add vídeo na playlist: {pl_err}")
                        playlist_status = "failed"

                # Create lesson
                new_lesson = Lesson(
                    title=title,
                    video_url=upload_result['video_url'],
                    video_type='youtube',
                    module=module,
                    order=current_order,
                )
                db.session.add(new_lesson)
                db.session.flush()

                results.append({
                    'index': i,
                    'title': title,
                    'success': True,
                    'video_id': upload_result['video_id'],
                    'video_url': upload_result['video_url'],
                    'lesson_id': new_lesson.id,
                    'playlist_status': playlist_status,
                })
                current_order += 1
            else:
                results.append({
                    'index': i,
                    'title': title,
                    'success': False,
                    'error': upload_result.get('error', 'Falha no upload'),
                })

        except Exception as e:
            logger.error(f"Erro no upload do vídeo {i}: {e}")
            results.append({
                'index': i,
                'title': title,
                'success': False,
                'error': str(e),
            })

    db.session.commit()

    success_count = sum(1 for r in results if r['success'])
    total_count = len(results)

    return jsonify({
        'success': True,
        'message': f'{success_count}/{total_count} vídeos enviados com sucesso.',
        'results': results,
        'playlist_id': playlist_id,
    })
