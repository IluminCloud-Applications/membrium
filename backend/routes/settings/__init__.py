from flask import Blueprint
from .general import general_bp
from .integrations import integrations_bp
from .ai import ai_bp

settings_bp = Blueprint('settings', __name__)

# Register sub-blueprints
settings_bp.register_blueprint(general_bp)
settings_bp.register_blueprint(integrations_bp)
settings_bp.register_blueprint(ai_bp)
