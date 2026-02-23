"""
YouTube OAuth2 Connection - Handles the OAuth2 flow for YouTube Data API v3.

Flow:
1. Admin saves client_id + client_secret in Settings
2. Admin clicks "Conectar YouTube" → redirected to Google consent screen
3. Google redirects back with auth code → we exchange for tokens
4. We store refresh_token in Settings for persistent access
"""
import logging
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

logger = logging.getLogger("integrations.youtube.connection")

SCOPES = [
    'https://www.googleapis.com/auth/youtube',
]
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'


def _build_client_config(client_id: str, client_secret: str) -> dict:
    """Build the client config dict from stored credentials."""
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def build_auth_url(client_id: str, client_secret: str, redirect_uri: str) -> str:
    """
    Build the Google OAuth2 authorization URL.
    Returns the URL the admin should be redirected to.
    """
    client_config = _build_client_config(client_id, client_secret)

    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        include_granted_scopes='true',
    )

    return authorization_url


def exchange_code(
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict:
    """
    Exchange the authorization code for tokens.
    Returns dict with refresh_token, channel_name, channel_id.
    """
    client_config = _build_client_config(client_id, client_secret)

    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    if not credentials.refresh_token:
        raise ValueError("Não foi possível obter o refresh token. Tente revogar o acesso e reconectar.")

    # Fetch channel info
    youtube = build(API_SERVICE_NAME, API_VERSION, credentials=credentials)
    channels_response = youtube.channels().list(
        part="snippet",
        mine=True,
    ).execute()

    channel_name = ""
    channel_id = ""
    if channels_response.get("items"):
        channel = channels_response["items"][0]
        channel_name = channel["snippet"]["title"]
        channel_id = channel["id"]

    logger.info(f"YouTube conectado: canal={channel_name} ({channel_id})")

    return {
        "refresh_token": credentials.refresh_token,
        "channel_name": channel_name,
        "channel_id": channel_id,
    }


def get_youtube_service(client_id: str, client_secret: str, refresh_token: str):
    """
    Build an authenticated YouTube API service from stored tokens.
    Uses the refresh_token to generate a fresh access_token.
    """
    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )

    return build(API_SERVICE_NAME, API_VERSION, credentials=credentials)
