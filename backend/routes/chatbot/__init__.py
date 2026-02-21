from flask import Blueprint
from .config import config_bp
from .chat import chat_bp

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

# Register sub-blueprints
chatbot_bp.register_blueprint(config_bp)
chatbot_bp.register_blueprint(chat_bp)
