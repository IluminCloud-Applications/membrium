"""
Telegram Blueprint — agrupa todas as rotas da integração Telegram.

Prefixo: /api/telegram
"""
from flask import Blueprint
from .credentials import telegram_credentials_bp
from .channel import telegram_channel_bp
from .upload import telegram_upload_bp
from .stream import telegram_stream_bp

telegram_bp = Blueprint('telegram', __name__, url_prefix='/api/telegram')

telegram_bp.register_blueprint(telegram_credentials_bp)
telegram_bp.register_blueprint(telegram_channel_bp)
telegram_bp.register_blueprint(telegram_upload_bp)
telegram_bp.register_blueprint(telegram_stream_bp)
