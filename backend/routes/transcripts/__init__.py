from flask import Blueprint
from .crud import crud_bp
from .stats import stats_bp
from .selectors import selectors_bp
from .ai import ai_bp

transcripts_bp = Blueprint('transcripts', __name__, url_prefix='/api/transcripts')

# Register sub-blueprints
transcripts_bp.register_blueprint(crud_bp)
transcripts_bp.register_blueprint(stats_bp)
transcripts_bp.register_blueprint(selectors_bp)
transcripts_bp.register_blueprint(ai_bp)
