from flask import Blueprint
from .list_courses import list_courses_bp
from .crud_courses import crud_courses_bp
from .groups import groups_bp

courses_bp = Blueprint('courses', __name__, url_prefix='/api/courses')

# Register sub-blueprints
courses_bp.register_blueprint(list_courses_bp)
courses_bp.register_blueprint(crud_courses_bp)
courses_bp.register_blueprint(groups_bp)
