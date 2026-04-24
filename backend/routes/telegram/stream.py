"""
Telegram Stream Route — Proxy de vídeo para o aluno.

Endpoint:
  GET /api/telegram/stream/<int:lesson_id>

O frontend do aluno faz requests com Range header.
Buscamos os chunks do Telegram e repassamos ao cliente usando
um generator thread-safe (sem carregar o arquivo inteiro na memória).

Baixo uso de CPU/RAM — sem re-encoding, só proxy de bytes.
"""
import json
import logging
from flask import Blueprint, request, Response, jsonify, session
from models import Lesson, Student

logger = logging.getLogger("routes.telegram.stream")

telegram_stream_bp = Blueprint('telegram_stream', __name__)


def _parse_range(range_header: str, file_size: int) -> tuple[int, int]:
    """Parseia o header Range e retorna (start, end). Tolerante a malformed headers."""
    try:
        if not range_header.startswith('bytes='):
            return 0, max(file_size - 1, 0)
        
        ranges = range_header.replace('bytes=', '').split('-')
        start_str = ranges[0].strip()
        end_str = ranges[1].strip() if len(ranges) > 1 else ''

        if start_str == '':
            # Suffix byte range: e.g. "bytes=-500" means last 500 bytes
            suffix_len = int(end_str)
            start = max(0, file_size - suffix_len)
            end = max(file_size - 1, 0)
        else:
            start = int(start_str)
            if end_str != '':
                end = int(end_str)
            else:
                end = max(file_size - 1, 0)

        end = min(end, file_size - 1) if file_size > 0 else end
        start = min(start, end)
        return start, end
    except Exception:
        return 0, max(file_size - 1, 0)


@telegram_stream_bp.route('/stream/<int:lesson_id>', methods=['GET'])
def stream_video(lesson_id: int):
    """
    Proxy de streaming de vídeo do Telegram para o aluno.

    Suporta Range requests para compatibilidade com players HTML5 (seek, pausa, retoma).
    """
    # Auth: aluno ou admin preview
    user_id = session.get('user_id')
    user_type = session.get('user_type')

    if not user_id:
        return jsonify({'error': 'Não autorizado'}), 401

    # Carrega a aula
    lesson = Lesson.query.get(lesson_id)
    if not lesson or lesson.video_type != 'telegram':
        return jsonify({'error': 'Aula não encontrada ou não é vídeo Telegram'}), 404

    # Verifica acesso do aluno (admin pode ver tudo)
    if user_type == 'student':
        student = Student.query.get(user_id)
        if not student:
            return jsonify({'error': 'Não autorizado'}), 401

        module = lesson.module
        course = module.course if module else None
        if not course or course not in student.courses:
            return jsonify({'error': 'Sem acesso a este curso'}), 403

    # Parseia os metadados JSON do campo video_url
    try:
        meta = json.loads(lesson.video_url)
        message_id = int(meta['message_id'])
        canal_id = int(meta['canal_id'])
        file_size = int(meta.get('tamanho_bytes', 0))
        mime_type = meta.get('mime_type', 'video/mp4')
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error(f"Metadados inválidos para aula {lesson_id}: {e}")
        return jsonify({'error': 'Metadados de vídeo inválidos'}), 500

    # Carrega credenciais do Telegram
    from db.integration_helpers import get_integration
    _, tg_config = get_integration('telegram')

    if not tg_config.get('session_string'):
        # Session expirada ou não configurada — retorna 503 com mensagem clara
        session_error = tg_config.get('session_error', '')
        return jsonify({
            'error': session_error or 'Telegram não configurado ou sessão expirada.'
        }), 503

    api_id = int(tg_config['api_id'])
    api_hash = tg_config['api_hash']
    session_string = tg_config['session_string']

    # Parseia Range request (suporte a seeks do player)
    range_header = request.headers.get('Range')
    if range_header and file_size > 0:
        start, end = _parse_range(range_header, file_size)
        
        # Força limite máximo por chunk para evitar bloquear Gunicorn sync workers indefinidamente
        CHUNK_SIZE_LIMIT = 5 * 1024 * 1024  # 5MB
        if end - start > CHUNK_SIZE_LIMIT:
            end = start + CHUNK_SIZE_LIMIT - 1

        length = end - start + 1
        status = 206
        headers = {
            'Content-Range': f'bytes {start}-{end}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(length),
            'Content-Type': mime_type,
            'Cache-Control': 'no-cache',
        }
    else:
        start = 0
        length = file_size if file_size > 0 else None
        status = 200
        headers = {
            'Accept-Ranges': 'bytes',
            'Content-Type': mime_type,
            'Cache-Control': 'no-cache',
        }
        if file_size > 0:
            headers['Content-Length'] = str(file_size)

    from integrations.telegram.service import stream_video_chunks, TelegramSessionExpiredError

    def generate():
        try:
            for chunk in stream_video_chunks(
                api_id=api_id,
                api_hash=api_hash,
                session_string=session_string,
                canal_id=canal_id,
                message_id=message_id,
                offset_bytes=start,
                length=length,
            ):
                yield chunk

        except TelegramSessionExpiredError:
            # Marca a session como inválida para o admin reautenticar
            logger.error(f"Session Telegram expirada ao fazer stream da aula {lesson_id}.")
            _invalidate_session()
            # Não há como retornar 503 dentro de um generator; o player vai detectar
            # a conexão encerrada e exibir erro de reprodução.

        except Exception as e:
            logger.error(f"Erro no stream Telegram (lesson={lesson_id}): {e}")

    return Response(
        generate(),
        status=status,
        headers=headers,
        direct_passthrough=True,
    )


def _invalidate_session():
    """Marca session como inválida no banco (força reautenticação do admin)."""
    try:
        from db.integration_helpers import get_integration, set_integration
        _, config = get_integration('telegram')
        config.pop('session_string', None)
        config['session_error'] = (
            'Sessão do Telegram foi revogada ou expirou. '
            'Reconecte em Configurações → Integrações → Telegram.'
        )
        set_integration('telegram', False, config)
    except Exception as e:
        logger.error(f"Erro ao invalidar session no banco: {e}")
