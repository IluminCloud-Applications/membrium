"""
YouTube Integration - OAuth2 connection and video upload.

Handles:
- OAuth2 flow for connecting user's YouTube channel
- Video upload (single & bulk) via YouTube Data API v3
"""
from .connection import get_youtube_service, build_auth_url, exchange_code
from .insert_video import upload_video_to_youtube

__all__ = [
    'get_youtube_service',
    'build_auth_url',
    'exchange_code',
    'upload_video_to_youtube',
]
