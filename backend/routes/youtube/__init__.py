from flask import Blueprint
from .oauth import youtube_oauth_bp
from .upload import youtube_upload_bp

youtube_bp = Blueprint('youtube', __name__, url_prefix='/api/youtube')

youtube_bp.register_blueprint(youtube_oauth_bp)
youtube_bp.register_blueprint(youtube_upload_bp)
