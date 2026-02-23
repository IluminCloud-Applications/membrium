"""
YouTube Playlist Management - Create, find and manage playlists via YouTube Data API v3.

Handles:
- Finding existing playlists by title
- Creating new playlists
- Adding videos to playlists
- get_or_create pattern for automatic playlist management
"""
import logging
from googleapiclient.errors import HttpError

logger = logging.getLogger("integrations.youtube.playlist")


def find_playlist_by_title(youtube_service, title: str) -> str | None:
    """
    Search for an existing playlist by title in the authenticated channel.

    Args:
        youtube_service: Authenticated YouTube API service
        title: Playlist title to search for

    Returns:
        Playlist ID if found, None otherwise
    """
    try:
        next_page_token = None

        while True:
            response = youtube_service.playlists().list(
                part="snippet",
                mine=True,
                maxResults=50,
                pageToken=next_page_token,
            ).execute()

            for item in response.get("items", []):
                if item["snippet"]["title"].strip().lower() == title.strip().lower():
                    playlist_id = item["id"]
                    logger.info(f"Playlist encontrada: '{title}' → {playlist_id}")
                    return playlist_id

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        logger.info(f"Playlist não encontrada: '{title}'")
        return None

    except HttpError as e:
        logger.error(f"Erro ao buscar playlists: {e.resp.status} - {e.content}")
        raise


def create_playlist(
    youtube_service,
    title: str,
    description: str = "",
    privacy_status: str = "unlisted",
) -> str:
    """
    Create a new playlist on the authenticated channel.

    Args:
        youtube_service: Authenticated YouTube API service
        title: Playlist title
        description: Playlist description (optional)
        privacy_status: 'unlisted', 'private', or 'public'

    Returns:
        The created playlist ID
    """
    body = {
        "snippet": {
            "title": title,
            "description": description,
        },
        "status": {
            "privacyStatus": privacy_status,
        },
    }

    try:
        response = youtube_service.playlists().insert(
            part="snippet,status",
            body=body,
        ).execute()

        playlist_id = response["id"]
        logger.info(f"Playlist criada: '{title}' → {playlist_id}")
        return playlist_id

    except HttpError as e:
        logger.error(f"Erro ao criar playlist: {e.resp.status} - {e.content}")
        raise


def add_video_to_playlist(youtube_service, playlist_id: str, video_id: str) -> dict:
    """
    Add a video to a playlist.

    Args:
        youtube_service: Authenticated YouTube API service
        playlist_id: YouTube playlist ID
        video_id: YouTube video ID

    Returns:
        dict with 'success' and 'playlist_item_id'
    """
    body = {
        "snippet": {
            "playlistId": playlist_id,
            "resourceId": {
                "kind": "youtube#video",
                "videoId": video_id,
            },
        },
    }

    try:
        response = youtube_service.playlistItems().insert(
            part="snippet",
            body=body,
        ).execute()

        playlist_item_id = response["id"]
        logger.info(f"Vídeo {video_id} adicionado à playlist {playlist_id}")
        return {
            "success": True,
            "playlist_item_id": playlist_item_id,
        }

    except HttpError as e:
        error_reason = ""
        if e.resp.status == 409 or "videoAlreadyInPlaylist" in str(e.content):
            logger.warning(f"Vídeo {video_id} já está na playlist {playlist_id}")
            return {
                "success": True,
                "playlist_item_id": None,
                "already_exists": True,
            }

        logger.error(f"Erro ao adicionar vídeo à playlist: {e.resp.status} - {e.content}")
        return {
            "success": False,
            "error": str(e),
        }


def get_or_create_playlist(
    youtube_service,
    title: str,
    description: str = "",
    privacy_status: str = "unlisted",
) -> str:
    """
    Find a playlist by title or create it if it doesn't exist.

    Args:
        youtube_service: Authenticated YouTube API service
        title: Playlist title (typically the module name)
        description: Playlist description if creating new
        privacy_status: Privacy status if creating new

    Returns:
        Playlist ID (existing or newly created)
    """
    playlist_id = find_playlist_by_title(youtube_service, title)

    if playlist_id:
        return playlist_id

    return create_playlist(
        youtube_service,
        title=title,
        description=description,
        privacy_status=privacy_status,
    )
