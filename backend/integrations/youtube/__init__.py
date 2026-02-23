"""
YouTube Integration - OAuth2 connection, video upload and playlist management.

Handles:
- OAuth2 flow for connecting user's YouTube channel
- Video upload (single & bulk) via YouTube Data API v3
- Playlist management (create, find, add videos)
"""
from .connection import get_youtube_service, build_auth_url, exchange_code
from .insert_video import upload_video_to_youtube
from .playlist import (
    find_playlist_by_title,
    create_playlist,
    add_video_to_playlist,
    get_or_create_playlist,
)

__all__ = [
    'get_youtube_service',
    'build_auth_url',
    'exchange_code',
    'upload_video_to_youtube',
    'find_playlist_by_title',
    'create_playlist',
    'add_video_to_playlist',
    'get_or_create_playlist',
]
