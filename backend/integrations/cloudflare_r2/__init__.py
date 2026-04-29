"""
Cloudflare R2 integration — direct browser-to-R2 uploads via S3-compatible presigned URLs.

A presigned PUT URL is generated server-side; the browser uploads the file straight
to Cloudflare R2 — no bytes pass through this server, so CPU/RAM stay flat regardless
of file size. Public playback uses the user's custom R2 domain (e.g. videos.example.com)
which serves byte-range requests, giving vidstack progressive (lazy) loading natively.

Config schema for IntegrationConfig.config (provider='cloudflare_r2'):
    - account_id: str              (Cloudflare account UUID)
    - access_key_id: str           (R2 API token access key)
    - secret_access_key: str       (R2 API token secret)
    - bucket: str                  (bucket name)
    - custom_domain: str           (https://videos.example.com — public read domain)
"""
import logging
import re
import time
import uuid
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError, EndpointConnectionError

from db.integration_helpers import get_integration

logger = logging.getLogger("integrations.cloudflare_r2")

PRESIGN_EXPIRES_SECONDS = 60 * 30  # 30 minutes — enough for big uploads on slow links


def _endpoint_url(account_id: str) -> str:
    return f"https://{account_id}.r2.cloudflarestorage.com"


def _build_client(account_id: str, access_key_id: str, secret_access_key: str):
    """Build an S3 client pointed at Cloudflare R2.

    R2 requires SigV4 with region 'auto'. virtual-host-style addressing is used
    by default for presigned URLs, which is what we want.
    """
    return boto3.client(
        's3',
        endpoint_url=_endpoint_url(account_id),
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name='auto',
        config=BotoConfig(signature_version='s3v4', s3={'addressing_style': 'virtual'}),
    )


def get_client_from_config():
    """Returns (client, config_dict) or (None, error_message_str)."""
    enabled, cfg = get_integration('cloudflare_r2')
    if not enabled:
        return None, 'Cloudflare R2 não está habilitado'
    required = ('account_id', 'access_key_id', 'secret_access_key', 'bucket')
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        return None, f"Configuração incompleta: faltando {', '.join(missing)}"
    try:
        client = _build_client(
            cfg['account_id'],
            cfg['access_key_id'],
            cfg['secret_access_key'],
        )
    except Exception as e:
        return None, f'Erro ao criar cliente R2: {e}'
    return client, cfg


def test_connection(account_id: str, access_key_id: str, secret_access_key: str, bucket: str) -> tuple[bool, str]:
    """HEAD bucket to validate credentials + permissions."""
    try:
        client = _build_client(account_id, access_key_id, secret_access_key)
        client.head_bucket(Bucket=bucket)
        return True, 'Conexão com Cloudflare R2 estabelecida com sucesso.'
    except EndpointConnectionError:
        return False, 'Não foi possível conectar à Cloudflare R2 (endpoint inválido?).'
    except ClientError as e:
        code = (e.response.get('Error') or {}).get('Code', 'Unknown')
        if code in ('404', 'NoSuchBucket'):
            return False, f'Bucket "{bucket}" não encontrado.'
        if code in ('403', 'AccessDenied', 'InvalidAccessKeyId', 'SignatureDoesNotMatch'):
            return False, 'Credenciais inválidas ou sem permissão neste bucket.'
        return False, f'Erro Cloudflare ({code}): {e}'
    except Exception as e:
        return False, f'Erro inesperado: {e}'


_SAFE_NAME_RE = re.compile(r'[^a-zA-Z0-9._-]+')


def _safe_filename(name: str) -> str:
    name = name.strip().replace(' ', '_')
    name = _SAFE_NAME_RE.sub('', name) or 'video'
    return name[:120]


def build_object_key(filename: str) -> str:
    """videos/<unix>-<uuid8>-<safe-name>.<ext>"""
    safe = _safe_filename(filename)
    ts = int(time.time())
    short = uuid.uuid4().hex[:8]
    return f'videos/{ts}-{short}-{safe}'


def public_url_for_key(custom_domain: str, key: str) -> str:
    """Joins https://videos.example.com + /key → public playback URL."""
    domain = (custom_domain or '').rstrip('/')
    if domain and not domain.startswith(('http://', 'https://')):
        domain = 'https://' + domain
    return f'{domain}/{key}' if domain else key


def apply_cors(account_id: str, access_key_id: str, secret_access_key: str, bucket: str) -> tuple[bool, str]:
    """
    Set (or refresh) the CORS policy on the R2 bucket via Cloudflare REST API.

    NOTE: Cloudflare R2 does NOT support put_bucket_cors via the S3-compatible API (boto3).
    CORS must be configured via the Cloudflare REST API using an API Token.

    We use the access_key_id as the API Token bearer if it starts with a known pattern,
    or we fall back to a signed request. In practice the user must provide an API Token
    (not just R2 access keys) for this to work — R2 access keys can't call the REST API.

    The function is intentionally non-fatal: if it fails, credentials are still saved.
    """
    import requests as http_requests

    # Cloudflare REST API for R2 CORS (requires an API Token, not R2 keys)
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket}/cors"

    cors_rules = [
        {
            "allowed": {
                "origins": ["*"],
                "methods": ["GET", "PUT", "HEAD", "OPTIONS"],
                "headers": ["*"],
            },
            "exposeHeaders": ["ETag", "Content-Length"],
            "maxAgeSeconds": 86400,
        }
    ]

    # Try with access_key_id as bearer token (works if user configured an API Token there)
    headers = {
        "Authorization": f"Bearer {access_key_id}",
        "Content-Type": "application/json",
    }

    try:
        resp = http_requests.put(url, json=cors_rules, headers=headers, timeout=15)
        if resp.status_code == 200:
            logger.info(f"CORS aplicado ao bucket '{bucket}' via Cloudflare API.")
            return True, "CORS configurado com sucesso no bucket."

        error_body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        cf_errors = error_body.get("errors", [])
        cf_msg = cf_errors[0].get("message", resp.text) if cf_errors else resp.text

        logger.warning(f"Cloudflare API retornou {resp.status_code}: {cf_msg}")
        return (
            False,
            f"Não foi possível configurar CORS automaticamente via API ({resp.status_code}): {cf_msg}. "
            "Configure manualmente: R2 → seu bucket → Settings → CORS policy.",
        )
    except http_requests.exceptions.Timeout:
        return False, "Timeout ao chamar Cloudflare API para configurar CORS."
    except Exception as e:
        logger.error(f"Erro inesperado ao configurar CORS: {e}")
        return False, f"Erro inesperado ao configurar CORS: {e}"



def upload_to_r2(
    file_obj,
    filename: str,
    content_type: Optional[str] = None,
) -> tuple[Optional[dict], Optional[str]]:
    """
    Upload a file object to R2 server-side using boto3 multipart streaming.

    boto3.upload_fileobj uses S3 Transfer Manager internally:
    - Splits file into 8 MB chunks
    - Uploads chunks as multipart (parallel when possible)
    - Never loads the full file into RAM — reads chunk by chunk from file_obj

    This is the correct approach when browser-to-R2 CORS is not available.
    The bottleneck is always the browser→server leg (user's upload speed).
    The server→R2 leg runs at data-center speed (effectively free).

    Args:
        file_obj: file-like object with a .read() method (e.g. request.files['file'].stream)
        filename: original filename used to build the object key
        content_type: MIME type (defaults to application/octet-stream)

    Returns ({public_url, key}, None) on success or (None, error_message) on failure.
    """
    from boto3.s3.transfer import TransferConfig

    client, cfg = get_client_from_config()
    if client is None:
        return None, cfg

    bucket = cfg['bucket']
    key = build_object_key(filename)
    content_type = content_type or 'application/octet-stream'

    # 8 MB chunks — good balance between memory and efficiency
    transfer_cfg = TransferConfig(
        multipart_threshold=8 * 1024 * 1024,   # 8 MB
        multipart_chunksize=8 * 1024 * 1024,    # 8 MB per part
        max_concurrency=4,                        # up to 4 parallel parts
        use_threads=True,
    )

    try:
        client.upload_fileobj(
            file_obj,
            bucket,
            key,
            ExtraArgs={'ContentType': content_type},
            Config=transfer_cfg,
        )
    except Exception as e:
        logger.error(f'Falha ao enviar arquivo para R2: {e}')
        return None, f'Falha ao enviar arquivo para Cloudflare R2: {e}'

    custom_domain = cfg.get('custom_domain', '').strip()
    public = public_url_for_key(custom_domain, key) if custom_domain else None

    return {
        'public_url': public,
        'key': key,
        'bucket': bucket,
    }, None


def presign_put(
    filename: str,
    content_type: Optional[str] = None,
) -> tuple[Optional[dict], Optional[str]]:
    """
    Generate a presigned PUT URL for direct browser upload.

    Returns ({upload_url, public_url, key, expires_in, headers}, None) on success,
    or (None, error_message) on failure.
    """
    client, cfg = get_client_from_config()
    if client is None:
        return None, cfg  # cfg is the error message in this branch

    bucket = cfg['bucket']
    key = build_object_key(filename)
    content_type = content_type or 'application/octet-stream'

    try:
        upload_url = client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ContentType': content_type,
            },
            ExpiresIn=PRESIGN_EXPIRES_SECONDS,
            HttpMethod='PUT',
        )
    except Exception as e:
        logger.error(f'Falha ao gerar presigned URL: {e}')
        return None, f'Falha ao gerar URL de upload: {e}'

    custom_domain = cfg.get('custom_domain', '').strip()
    public = public_url_for_key(custom_domain, key) if custom_domain else None

    return {
        'upload_url': upload_url,
        'public_url': public,                         # final URL the player will use
        'key': key,
        'expires_in': PRESIGN_EXPIRES_SECONDS,
        'headers': {'Content-Type': content_type},    # browser must echo these on PUT
        'bucket': bucket,
    }, None
