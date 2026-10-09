"""External API Blueprint — public developer endpoints version 1."""
from flask import Blueprint
from .students import external_students_bp

external_api_bp = Blueprint('external_api', __name__, url_prefix='/api/v1')

# Register endpoints under /api/v1
external_api_bp.register_blueprint(external_students_bp)
