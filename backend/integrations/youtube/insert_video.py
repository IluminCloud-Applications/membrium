"""
YouTube Video Upload - Handles uploading videos to YouTube via Data API v3.

Uses resumable upload for reliability with large files.
Videos are uploaded as 'unlisted' by default.
"""
import logging
import time
import random
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

logger = logging.getLogger("integrations.youtube.insert_video")

# Retry config for resumable uploads
MAX_RETRIES = 5
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]


def upload_video_to_youtube(
    youtube_service,
    file_path: str,
    title: str,
    description: str = "",
    category_id: str = "22",
    privacy_status: str = "unlisted",
) -> dict:
    """
    Upload a video file to YouTube.

    Args:
        youtube_service: Authenticated YouTube API service
        file_path: Local path to the video file
        title: Video title
        description: Video description (optional)
        category_id: YouTube category (default: 22 = People & Blogs)
        privacy_status: 'unlisted', 'private', or 'public'

    Returns:
        dict with 'video_id' and 'video_url' on success
    """
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
        },
    }

    media = MediaFileUpload(
        file_path,
        chunksize=10 * 1024 * 1024,  # 10MB chunks
        resumable=True,
    )

    request = youtube_service.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = _resumable_upload(request)

    if response:
        video_id = response["id"]
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        logger.info(f"Upload concluído: {title} → {video_url}")
        return {
            "success": True,
            "video_id": video_id,
            "video_url": video_url,
        }

    return {
        "success": False,
        "error": "Upload falhou após todas as tentativas.",
    }


def _resumable_upload(request) -> dict | None:
    """
    Execute a resumable upload with exponential backoff retry.
    Returns the API response dict on success, None on failure.
    """
    response = None
    retry = 0

    while response is None:
        try:
            status, response = request.next_chunk()
            if status:
                progress = int(status.progress() * 100)
                logger.debug(f"Upload progress: {progress}%")

        except HttpError as e:
            if e.resp.status in RETRIABLE_STATUS_CODES:
                retry += 1
                if retry > MAX_RETRIES:
                    logger.error(f"Upload falhou após {MAX_RETRIES} tentativas")
                    return None

                sleep_seconds = random.random() * (2 ** retry)
                logger.warning(
                    f"Erro HTTP {e.resp.status}, retentativa {retry}/{MAX_RETRIES} "
                    f"em {sleep_seconds:.1f}s"
                )
                time.sleep(sleep_seconds)
            else:
                logger.error(f"Erro HTTP não-recuperável: {e.resp.status} - {e.content}")
                raise

        except Exception as e:
            retry += 1
            if retry > MAX_RETRIES:
                logger.error(f"Upload falhou após {MAX_RETRIES} tentativas: {e}")
                return None

            sleep_seconds = random.random() * (2 ** retry)
            logger.warning(f"Erro genérico, retentativa {retry}: {e}")
            time.sleep(sleep_seconds)

    return response
