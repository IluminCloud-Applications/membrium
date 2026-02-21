from flask import Blueprint
from .crud import crud_bp
from .analytics import analytics_bp

showcase_bp = Blueprint('showcase', __name__, url_prefix='/api/showcase')

# Register sub-blueprints
showcase_bp.register_blueprint(crud_bp)
showcase_bp.register_blueprint(analytics_bp)
