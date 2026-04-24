"""
TelegramService — Comunicação com a API do Telegram via Pyrogram (MTProto).

Usa conta de usuário (user account) para upload ilimitado sem limite de 50MB dos bots.

DESIGN:
  - Uma nova corrotina asyncio por chamada (seguro com Gunicorn sync workers)
  - Streaming via thread + queue para não carregar o arquivo inteiro na memória
  - Tratamento de session expirada/revogada com erro claro para o admin
  - Suporte a 2FA (cloud password)
"""
import asyncio
import logging
import os
import queue
import shutil
import tempfile
import threading
import traceback
from datetime import datetime
from typing import Generator

logger = logging.getLogger("integrations.telegram.service")

# Tamanho padrão de cada parte que o Pyrogram usa internamente (~512KB)
PART_SIZE = 1024 * 512


class TelegramAuthError(Exception):
    """Credenciais inválidas ou session invalidada pelo Telegram."""


class TelegramSessionExpiredError(TelegramAuthError):
    """A session_string foi revogada/expirou. Admin precisa reautenticar."""


class Telegram2FARequired(Exception):
    """Conta com verificação em duas etapas ativa. Senha obrigatória."""


def _run(coro):
    """Executa corrotina em novo event loop (thread-safe para Gunicorn sync workers)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _get_client(api_id: int, api_hash: str, session_string: str):
    """Cria client Pyrogram com session_string (sem arquivo em disco)."""
    from pyrogram import Client
    return Client(
        name="membrium",
        api_id=api_id,
        api_hash=api_hash,
        session_string=session_string,
    )


def _wrap_auth_errors(func):
    """Decorator que converte erros de auth do Pyrogram para exceções nossas."""
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except TelegramAuthError:
            raise
        except Exception as e:
            error_str = str(type(e).__name__).lower()
            msg = str(e).lower()
            if any(k in error_str or k in msg for k in (
                "authkeyunregistered", "sessionrevoked", "sessionexpired",
                "userdeactivated", "authkeyduplicated",
            )):
                raise TelegramSessionExpiredError(
                    "Sessão do Telegram foi revogada ou expirou. "
                    "O admin precisa reautenticar em Integrações → Telegram."
                ) from e
            raise

    return wrapper


# ─────────────────────────────────────────────────────────────────────
# Fluxo de autenticação (MTProto, uma vez só)
# ─────────────────────────────────────────────────────────────────────

# Client PERSISTENTE entre send_code e verify_code.
# Chave = phone. Guarda (client, loop, thread) para manter o client
# conectado e evitar PHONE_CODE_EXPIRED ao reconectar.
_pending_auth: dict[str, tuple] = {}
_pending_auth_lock = threading.Lock()

# Tempo máximo (segundos) que o client fica aguardando o verify_code
_AUTH_TTL = 300  # 5 minutos


def _cleanup_pending_auth(phone: str):
    """Desconecta e remove um client pendente de autenticação."""
    with _pending_auth_lock:
        entry = _pending_auth.pop(phone, None)
    if entry:
        client, loop, _ = entry
        try:
            loop.run_until_complete(client.disconnect())
        except Exception:
            pass
        try:
            loop.close()
        except Exception:
            pass


def send_code(api_id: int, api_hash: str, phone: str) -> dict:
    """
    Envia código de verificação mantendo o client CONECTADO em memória.

    O client NÃO é desconectado — fica guardado em _pending_auth para que
    verify_code() use a mesma conexão MTProto (mesma auth_key), evitando
    PHONE_CODE_EXPIRED que ocorre quando Pyrogram renegocia a auth_key.
    """
    from pyrogram import Client

    # Limpa tentativa anterior (se houver)
    _cleanup_pending_auth(phone)

    loop = asyncio.new_event_loop()

    async def _send():
        # Remove arquivo de sessão antigo
        session_file = "/tmp/membrium_tg_auth.session"
        if os.path.exists(session_file):
            os.remove(session_file)

        client = Client(
            name="/tmp/membrium_tg_auth",
            api_id=int(api_id),
            api_hash=str(api_hash),
        )
        await client.connect()
        result = await client.send_code(phone)
        return client, result.phone_code_hash

    try:
        client, phone_code_hash = loop.run_until_complete(_send())

        # Guarda client + loop para reutilizar em verify_code
        with _pending_auth_lock:
            _pending_auth[phone] = (client, loop, datetime.utcnow())

        # Timer para limpar se o usuário não verificar em _AUTH_TTL
        created_at = _pending_auth[phone][2]

        def _auto_cleanup():
            import time
            time.sleep(_AUTH_TTL)
            with _pending_auth_lock:
                entry = _pending_auth.get(phone)
                if entry and entry[2] == created_at:
                    _pending_auth.pop(phone, None)
                else:
                    return  # já foi substituído ou removido
            # Desconecta fora do lock
            if entry:
                try:
                    entry[1].run_until_complete(entry[0].disconnect())
                except Exception:
                    pass
                try:
                    entry[1].close()
                except Exception:
                    pass
                logger.info("Auto-cleanup auth pendente para %s", phone)

        threading.Thread(target=_auto_cleanup, daemon=True).start()

        return {"phone_code_hash": phone_code_hash}
    except Exception:
        # Se falhou, limpa o loop
        try:
            loop.close()
        except Exception:
            pass
        logger.error("send_code traceback:\n%s", traceback.format_exc())
        raise


def verify_code(
    api_id: int,
    api_hash: str,
    phone: str,
    code: str,
    phone_code_hash: str,
    cloud_password: str | None = None,
) -> str:
    """
    Verifica código SMS (e 2FA) extraindo a sessão.
    Reutiliza o client que ficou conectado desde send_code().
    """
    from pyrogram import Client
    from pyrogram.errors import SessionPasswordNeeded

    # Tenta pegar o client que ficou conectado
    with _pending_auth_lock:
        entry = _pending_auth.pop(phone, None)

    if entry:
        client, loop, _ = entry
        return _verify_with_existing_client(client, loop, phone, code, phone_code_hash, cloud_password)

    # Fallback: se o client expirou ou foi limpo, tenta com arquivo de sessão
    logger.warning("Client pendente não encontrado para %s, tentando fallback com session file", phone)
    return _verify_with_new_client(api_id, api_hash, phone, code, phone_code_hash, cloud_password)


def _verify_with_existing_client(
    client, loop, phone, code, phone_code_hash, cloud_password
) -> str:
    """Verifica usando o client que já está conectado desde send_code()."""
    from pyrogram.errors import SessionPasswordNeeded

    async def _verify():
        try:
            await client.sign_in(phone, phone_code_hash, code)
        except SessionPasswordNeeded:
            if not cloud_password:
                # Precisa de 2FA — NÃO desconecta o client
                raise Telegram2FARequired(
                    "Sua conta tem verificação em duas etapas (2FA) ativa. "
                    "Informe a senha da nuvem."
                )
            await client.check_password(cloud_password)
        session_str = await client.export_session_string()
        await client.disconnect()
        return session_str

    try:
        result = loop.run_until_complete(_verify())
        _cleanup_loop_and_session(loop)
        return result
    except Telegram2FARequired:
        # Devolve o client para _pending_auth para a próxima chamada com password
        with _pending_auth_lock:
            _pending_auth[phone] = (client, loop, datetime.utcnow())
        raise
    except (TelegramAuthError,):
        _cleanup_loop_and_session(loop)
        raise
    except Exception:
        _cleanup_loop_and_session(loop)
        logger.error("verify_code traceback:\n%s", traceback.format_exc())
        raise


def _cleanup_loop_and_session(loop):
    """Fecha o event loop e remove o arquivo de sessão temporário."""
    try:
        loop.close()
    except Exception:
        pass
    session_file = "/tmp/membrium_tg_auth.session"
    if os.path.exists(session_file):
        os.remove(session_file)


def _verify_with_new_client(
    api_id, api_hash, phone, code, phone_code_hash, cloud_password
) -> str:
    """Fallback: cria novo client a partir do session file (menos confiável)."""
    from pyrogram import Client
    from pyrogram.errors import SessionPasswordNeeded

    async def _verify():
        client = Client(
            name="/tmp/membrium_tg_auth",
            api_id=int(api_id),
            api_hash=str(api_hash),
        )
        await client.connect()
        try:
            try:
                await client.sign_in(phone, phone_code_hash, code)
            except SessionPasswordNeeded:
                if not cloud_password:
                    raise Telegram2FARequired(
                        "Sua conta tem verificação em duas etapas (2FA) ativa. "
                        "Informe a senha da nuvem."
                    )
                await client.check_password(cloud_password)
            return await client.export_session_string()
        finally:
            await client.disconnect()

    try:
        result = _run(_verify())
        session_file = "/tmp/membrium_tg_auth.session"
        if os.path.exists(session_file):
            os.remove(session_file)
        return result
    except (Telegram2FARequired, TelegramAuthError):
        raise
    except Exception:
        logger.error("verify_code traceback:\n%s", traceback.format_exc())
        raise


# ─────────────────────────────────────────────────────────────────────
# Criar canal
# ─────────────────────────────────────────────────────────────────────

@_wrap_auth_errors
def create_channel(api_id: int, api_hash: str, session_string: str, title: str, description: str) -> dict:
    """Cria canal privado no Telegram. Retorna canal_id e invite_link."""
    async def _create():
        client = _get_client(api_id, api_hash, session_string)
        async with client:
            canal = await client.create_channel(title=title, description=description)
            invite = await client.create_chat_invite_link(canal.id)
            return {
                "canal_id": canal.id,
                "canal_nome": canal.title,
                "invite_link": invite.invite_link,
                "criado_em": datetime.utcnow().isoformat(),
            }

    return _run(_create())


# ─────────────────────────────────────────────────────────────────────
# Upload de vídeo
# ─────────────────────────────────────────────────────────────────────

async def _resolve_peer(client, canal_id: int):
    """
    Popula o cache de peers do Pyrogram para o canal_id.

    Quando usamos session_string (in-memory), o Pyrogram não persiste o
    cache de peers entre instâncias. Sem o cache, send_video/get_messages
    falham com "Peer id invalid". Chamar get_chat() força o Pyrogram a
    buscar e cachear o access_hash do canal.
    """
    try:
        await client.get_chat(canal_id)
    except Exception:
        # Fallback: tenta resolver via get_dialogs (mais lento, mas garante)
        logger.warning("get_chat falhou para %s, tentando get_dialogs...", canal_id)
        async for dialog in client.get_dialogs():
            if dialog.chat.id == canal_id:
                break


@_wrap_auth_errors
def upload_video(
    api_id: int,
    api_hash: str,
    session_string: str,
    canal_id: int,
    file_path: str,
    nome_original: str,
) -> dict:
    """Envia vídeo para o canal e retorna metadados para salvar no banco."""
    async def _upload():
        client = _get_client(api_id, api_hash, session_string)
        async with client:
            await _resolve_peer(client, canal_id)
            msg = await client.send_video(
                chat_id=canal_id,
                video=file_path,
                caption=nome_original,
                supports_streaming=True,  # essencial para seek no player
            )
            video = msg.video
            return {
                "message_id": msg.id,
                "canal_id": canal_id,
                "file_id": video.file_id,
                "file_unique_id": video.file_unique_id,
                "nome_original": nome_original,
                "tamanho_bytes": video.file_size,
                "duracao_segundos": video.duration,
                "largura": video.width,
                "altura": video.height,
                "mime_type": video.mime_type,
                "enviado_em": datetime.utcnow().isoformat(),
            }

    return _run(_upload())


# ─────────────────────────────────────────────────────────────────────
# Streaming por chunks — baixo uso de CPU/RAM
# ─────────────────────────────────────────────────────────────────────

_SENTINEL = object()  # marca o fim da fila


def stream_video_chunks(
    api_id: int,
    api_hash: str,
    session_string: str,
    canal_id: int,
    message_id: int,
    offset_bytes: int = 0,
    length: int | None = None,
) -> Generator[bytes, None, None]:
    """
    Gera chunks do vídeo de forma verdadeiramente lazy (sem carregar tudo na memória).

    Usa uma thread separada para rodar o código async do Pyrogram, alimentando
    uma queue. A thread principal (Flask WSGI) lê da queue e faz yield dos chunks.

    Args:
        offset_bytes: Byte inicial (para suporte a Range requests / seek).
        length: Número máximo de bytes a retornar (None = até o fim).

    Raises:
        TelegramSessionExpiredError: Se a session foi revogada.
    """
    chunk_queue: queue.Queue = queue.Queue(maxsize=8)  # backpressure: máx 8 chunks em memória
    error_holder: list = []

    async def _stream_async():
        try:
            client = _get_client(api_id, api_hash, session_string)
            async with client:
                await _resolve_peer(client, canal_id)
                msg = await client.get_messages(canal_id, message_id)
                if not msg or not msg.video:
                    chunk_queue.put(_SENTINEL)
                    return

                # Pyrogram's stream_media aceita offset em número de partes (PART_SIZE).
                # Calculamos qual parte corresponde ao byte solicitado.
                part_offset = offset_bytes // PART_SIZE
                skip_bytes = offset_bytes % PART_SIZE  # bytes da primeira parte a pular
                delivered = 0

                async for i, chunk in _indexed_stream(client, msg, part_offset):
                    # Na primeira parte, pode haver bytes antes do offset que pulamos
                    if i == 0 and skip_bytes > 0:
                        chunk = chunk[skip_bytes:]

                    if length is not None:
                        remaining = length - delivered
                        if len(chunk) >= remaining:
                            chunk = chunk[:remaining]
                            chunk_queue.put(chunk)
                            break
                        delivered += len(chunk)

                    chunk_queue.put(chunk)

        except Exception as e:
            error_holder.append(e)
        finally:
            chunk_queue.put(_SENTINEL)

    async def _indexed_stream(client, msg, part_offset: int):
        """Enumera chunks a partir de part_offset."""
        i = 0
        async for chunk in client.stream_media(msg, offset=part_offset):
            yield i, chunk
            i += 1

    # Executa o streaming em thread separada (não bloqueia o worker WSGI)
    def _run_thread():
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(_stream_async())
        finally:
            loop.close()

    t = threading.Thread(target=_run_thread, daemon=True)
    t.start()

    # Yield de chunks conforme chegam na queue
    while True:
        try:
            chunk = chunk_queue.get(timeout=60)  # 60s timeout por chunk
        except queue.Empty:
            logger.error("Timeout aguardando chunk do Telegram (message_id=%s)", message_id)
            break

        if chunk is _SENTINEL:
            break

        yield chunk

    t.join(timeout=5)

    # Propaga erro de auth após consumir os chunks
    if error_holders := error_holder:
        err = error_holders[0]
        error_str = str(type(err).__name__).lower()
        if any(k in error_str for k in ("authkey", "session", "userdeactivated")):
            raise TelegramSessionExpiredError(str(err)) from err
        raise err
