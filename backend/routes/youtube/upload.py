"""
YouTube Upload Routes - Handles single and bulk video uploads.

Endpoints:
- POST /api/youtube/upload          → Upload a single video
- POST /api/youtube/upload/bulk     → Upload multiple videos in sequence
"""
import os
import logging
import tempfile
from flask import Blueprint, request, jsonify, session
from functools import wraps
from werkzeug.utils import secure_filename
from db.database import db
from models import Admin, Settings, Lesson, Module

logger = logging.getLogger("routes.youtube.upload")

youtube_upload_bp = Blueprint('youtube_upload', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def _get_youtube_service():
    """Get authenticated YouTube service from stored credentials."""
    from integrations.youtube.connection import get_youtube_service

    settings = Settings.query.first()
    if not settings or not settings.youtube_refresh_token:
        return None, "YouTube não está conectado."

    if not settings.youtube_client_id or not settings.youtube_client_secret:
        return None, "Credenciais YouTube não configuradas."

    try:
        service = get_youtube_service(
            client_id=settings.youtube_client_id,
            client_secret=settings.youtube_client_secret,
            refresh_token=settings.youtube_refresh_token,
        )
        return service, None
    except Exception as e:
        logger.error(f"Erro ao criar serviço YouTube: {e}")
        return None, f"Erro de autenticação: {str(e)}"


@youtube_upload_bp.route('/upload', methods=['POST'])
@admin_required
def upload_single():
    """
    Upload a single video to YouTube.
    
    Expects multipart form data:
    - video: File (the video file)
    - title: str (video title)
    - lesson_id: int (optional, lesson to associate the video URL with)
    """
    from integrations.youtube.insert_video import upload_video_to_youtube

    service, error = _get_youtube_service()
    if error:
        return jsonify({'success': False, 'message': error}), 400

    video_file = request.files.get('video')
    title = request.form.get('title', '').strip()

    if not video_file or not video_file.filename:
        return jsonify({'success': False, 'message': 'Nenhum vídeo enviado.'}), 400
    if not title:
        return jsonify({'success': False, 'message': 'Título é obrigatório.'}), 400

    # Save temp file
    temp_dir = tempfile.mkdtemp()
    filename = secure_filename(video_file.filename)
    temp_path = os.path.join(temp_dir, filename)

    try:
        video_file.save(temp_path)

        result = upload_video_to_youtube(
            youtube_service=service,
            file_path=temp_path,
            title=title,
        )

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
    finally:
        # Cleanup temp file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


@youtube_upload_bp.route('/upload/bulk', methods=['POST'])
@admin_required
def upload_bulk():
    """
    Upload multiple videos to YouTube in sequence.
    Creates lessons automatically in the specified module.
    Adds all uploaded videos to a YouTube playlist named after the module.

    Expects multipart form data:
    - videos: File[] (multiple video files)
    - titles: str (JSON array of titles, matching video order)
    - module_id: int (module to create lessons in)
    """
    import json
    from integrations.youtube.insert_video import upload_video_to_youtube
    from integrations.youtube.playlist import get_or_create_playlist, add_video_to_playlist

    service, error = _get_youtube_service()
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

    # Get or create YouTube playlist with the module name
    playlist_id = None
    try:
        course_name = module.course.title if module.course else ""
        playlist_description = f"Aulas do módulo \"{module.title}\""
        if course_name:
            playlist_description += f" — Curso: {course_name}"

        playlist_id = get_or_create_playlist(
            youtube_service=service,
            title=module.title,
            description=playlist_description,
        )
        logger.info(f"Playlist para módulo '{module.title}': {playlist_id}")
    except Exception as e:
        logger.warning(f"Não foi possível criar/encontrar playlist: {e}")
        # Continue without playlist — uploads still work

    # Ensure titles list matches videos length
    while len(titles) < len(videos):
        idx = len(titles)
        fallback = videos[idx].filename or f"Aula {idx + 1}"
        fallback = os.path.splitext(fallback)[0]
        titles.append(fallback)

    results = []
    current_order = len(module.lessons) + 1
    temp_dir = tempfile.mkdtemp()

    try:
        for i, (video_file, title) in enumerate(zip(videos, titles)):
            title = title.strip() if title else f"Aula {current_order}"
            filename = secure_filename(video_file.filename or f"video_{i}.mp4")
            temp_path = os.path.join(temp_dir, filename)

            try:
                video_file.save(temp_path)

                upload_result = upload_video_to_youtube(
                    youtube_service=service,
                    file_path=temp_path,
                    title=title,
                )

                if upload_result.get('success'):
                    # Add video to playlist
                    playlist_status = None
                    if playlist_id:
                        try:
                            pl_result = add_video_to_playlist(
                                service, playlist_id, upload_result['video_id']
                            )
                            playlist_status = "added" if pl_result.get("success") else "failed"
                        except Exception as pl_err:
                            logger.warning(f"Erro ao add vídeo na playlist: {pl_err}")
                            playlist_status = "failed"

                    # Create lesson with YouTube URL
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
            finally:
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception:
                    pass

        db.session.commit()

        success_count = sum(1 for r in results if r['success'])
        total_count = len(results)

        return jsonify({
            'success': True,
            'message': f'{success_count}/{total_count} vídeos enviados com sucesso.',
            'results': results,
            'playlist_id': playlist_id,
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro no upload em massa: {e}")
        return jsonify({
            'success': False,
            'message': f'Erro: {str(e)}',
        }), 500
    finally:
        # Cleanup temp dir
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass
