"""
YouTube Resumable Upload Session — Creates upload sessions for direct browser-to-YouTube uploads.

The server creates a resumable upload URI via the YouTube Data API.
The frontend then uploads the video file directly to YouTube using this URI.
This means ZERO file data passes through our server → no CPU/RAM usage.
"""
import logging
import json
from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials

logger = logging.getLogger("integrations.youtube.resumable_session")

YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
SCOPES = ["https://www.googleapis.com/auth/youtube"]


def create_resumable_upload_session(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    title: str,
    description: str = "",
    category_id: str = "22",
    privacy_status: str = "unlisted",
) -> dict:
    """
    Create a resumable upload session on YouTube.

    Returns a dict with:
    - upload_url: The resumable upload URI for direct browser upload
    - success: bool

    The browser will PUT the raw video bytes to `upload_url`.
    """
    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )

    authed_session = AuthorizedSession(credentials)

    metadata = {
        "snippet": {
            "title": title,
            "description": description,
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
        },
    }

    # Initiate a resumable upload — sends only metadata, no file data
    response = authed_session.post(
        YOUTUBE_UPLOAD_URL,
        params={
            "uploadType": "resumable",
            "part": "snippet,status",
        },
        headers={
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "video/*",
        },
        data=json.dumps(metadata),
    )

    if response.status_code not in (200, 308):
        logger.error(
            f"Falha ao criar sessão de upload: {response.status_code} - {response.text}"
        )
        return {
            "success": False,
            "error": f"YouTube retornou status {response.status_code}",
        }

    upload_url = response.headers.get("Location")
    if not upload_url:
        logger.error("YouTube não retornou URL de upload na resposta")
        return {
            "success": False,
            "error": "URL de upload não encontrada na resposta do YouTube",
        }

    logger.info(f"Sessão de upload criada para '{title}'")
    return {
        "success": True,
        "upload_url": upload_url,
    }
