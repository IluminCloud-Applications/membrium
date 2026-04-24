"""
Telegram Upload Routes

Endpoints:
  POST /api/telegram/upload          → Upload de 1 vídeo (associa a uma aula existente)
  POST /api/telegram/upload/bulk     → Upload em massa (cria aulas no módulo)

O vídeo é salvo temporariamente em disco, enviado ao Telegram,
e depois os metadados (message_id, canal_id, etc.) são gravados no banco.

O campo video_url da Lesson armazena JSON com os dados do Telegram:
  {"message_id": 42, "canal_id": -100xxx, "tamanho_bytes": 1234, ...}
"""
import json
import os
import logging
import tempfile
from functools import wraps
from flask import Blueprint, request, jsonify, session
from models import Admin, Lesson, Module
from db.database import db
from db.integration_helpers import get_integration
from integrations.telegram.service import TelegramSessionExpiredError

logger = logging.getLogger("routes.telegram.upload")

telegram_upload_bp = Blueprint('telegram_upload', __name__)


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


def _get_tg_creds():
    """Retorna (config, error_msg) com as credenciais do Telegram."""
    _, config = get_integration('telegram')
    if not config.get('session_string'):
        return None, "Telegram não está autenticado."
    if not config.get('canal_id'):
        return None, "Canal do Telegram não configurado. Crie um canal primeiro."
    return config, None


def _upload_to_telegram(config: dict, file_path: str, nome_original: str) -> dict:
    """Faz o upload para o Telegram e retorna os metadados."""
    from integrations.telegram.service import upload_video
    return upload_video(
        api_id=int(config['api_id']),
        api_hash=config['api_hash'],
        session_string=config['session_string'],
        canal_id=int(config['canal_id']),
        file_path=file_path,
        nome_original=nome_original,
    )


def _video_data_to_url(data: dict) -> str:
    """Serializa os metadados do Telegram para o campo video_url da Lesson."""
    return json.dumps({
        'message_id': data['message_id'],
        'canal_id': data['canal_id'],
        'file_id': data.get('file_id', ''),
        'tamanho_bytes': data.get('tamanho_bytes', 0),
        'duracao_segundos': data.get('duracao_segundos', 0),
        'mime_type': data.get('mime_type', 'video/mp4'),
        'nome_original': data.get('nome_original', ''),
    })


# ─── Upload único ──────────────────────────────────────────────────

@telegram_upload_bp.route('/upload', methods=['POST'])
@admin_required
def upload_single():
    """
    Upload de um único vídeo para o Telegram.

    Form data:
      - video: File
      - title: str
      - lesson_id: int (opcional — associa a aula existente)
    """
    config, error = _get_tg_creds()
    if error:
        return jsonify({'success': False, 'message': error}), 400

    video_file = request.files.get('video')
    title = request.form.get('title', '').strip()

    if not video_file or not video_file.filename:
        return jsonify({'success': False, 'message': 'Nenhum vídeo enviado.'}), 400
    if not title:
        return jsonify({'success': False, 'message': 'Título é obrigatório.'}), 400

    nome_original = video_file.filename

    # Salva temporariamente em disco
    suffix = os.path.splitext(nome_original)[1] or '.mp4'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        video_file.save(tmp)
        tmp_path = tmp.name

    try:
        result = _upload_to_telegram(config, tmp_path, nome_original)
        video_url = _video_data_to_url(result)

        # Associa à aula se lesson_id fornecido
        lesson_id = request.form.get('lesson_id')
        lesson_db_id = None
        if lesson_id:
            lesson = Lesson.query.get(int(lesson_id))
            if lesson:
                lesson.video_url = video_url
                lesson.video_type = 'telegram'
                db.session.commit()
                lesson_db_id = lesson.id

        return jsonify({
            'success': True,
            'message_id': result['message_id'],
            'canal_id': result['canal_id'],
            'duracao_segundos': result.get('duracao_segundos'),
            'tamanho_bytes': result.get('tamanho_bytes'),
            'lesson_id': lesson_db_id,
            'video_url': video_url,
            'message': f'"{title}" enviado com sucesso!',
        })

    except TelegramSessionExpiredError:
        return jsonify({'success': False, 'message': 'Sessão do Telegram expirada. Reconecte o Telegram.'}), 401
    except Exception as e:
        logger.error(f"upload_single error: {e}")
        return jsonify({'success': False, 'message': f'Erro no upload: {str(e)}'}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ─── Upload em massa ───────────────────────────────────────────────

@telegram_upload_bp.route('/upload/bulk', methods=['POST'])
@admin_required
def upload_bulk():
    """
    Upload de múltiplos vídeos para o Telegram, criando aulas no módulo.

    Form data:
      - videos: File[] (múltiplos arquivos)
      - titles: JSON string de títulos (ex: ["Aula 1", "Aula 2"])
      - module_id: int
    """
    config, error = _get_tg_creds()
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

    # Completa títulos faltantes com nome do arquivo
    while len(titles) < len(videos):
        idx = len(titles)
        fallback = os.path.splitext(videos[idx].filename or f"Aula {idx + 1}")[0]
        titles.append(fallback)

    results = []
    current_order = len(module.lessons) + 1

    for i, (video_file, title) in enumerate(zip(videos, titles)):
        title = title.strip() if title else f"Aula {current_order}"
        nome_original = video_file.filename or f"video_{i}.mp4"
        suffix = os.path.splitext(nome_original)[1] or '.mp4'
        
        caption_formatted = f"Módulo - {module.name}\nAula - {title}"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            video_file.save(tmp)
            tmp_path = tmp.name

        try:
            result = _upload_to_telegram(config, tmp_path, caption_formatted)
            video_url = _video_data_to_url(result)

            new_lesson = Lesson(
                title=title,
                video_url=video_url,
                video_type='telegram',
                module=module,
                order=current_order,
            )
            db.session.add(new_lesson)
            db.session.flush()

            results.append({
                'index': i,
                'title': title,
                'success': True,
                'message_id': result['message_id'],
                'canal_id': result['canal_id'],
                'lesson_id': new_lesson.id,
                'duracao_segundos': result.get('duracao_segundos'),
            })
            current_order += 1

        except Exception as e:
            logger.error(f"bulk upload [{i}] error: {e}")
            results.append({
                'index': i,
                'title': title,
                'success': False,
                'error': str(e),
            })
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    db.session.commit()

    success_count = sum(1 for r in results if r['success'])
    return jsonify({
        'success': True,
        'message': f'{success_count}/{len(results)} vídeos enviados com sucesso.',
        'results': results,
    })
