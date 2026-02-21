from flask import Blueprint
from .crud import crud_bp
from .analytics import analytics_bp

promote_bp = Blueprint('promote', __name__, url_prefix='/api/promote')

# Register sub-blueprints
promote_bp.register_blueprint(crud_bp)
promote_bp.register_blueprint(analytics_bp)
