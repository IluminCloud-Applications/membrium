from flask import Blueprint
from .course_details import course_details_bp
from .modules import modules_bp
from .lessons import lessons_bp
from .export_import import export_import_bp
from .auto_fill import auto_fill_bp
from .banner_prompt import banner_prompt_bp

course_modification_bp = Blueprint('course_modification', __name__, url_prefix='/api/course-modification')

# Register sub-blueprints
course_modification_bp.register_blueprint(course_details_bp)
course_modification_bp.register_blueprint(modules_bp)
course_modification_bp.register_blueprint(lessons_bp)
course_modification_bp.register_blueprint(export_import_bp)
course_modification_bp.register_blueprint(auto_fill_bp)
course_modification_bp.register_blueprint(banner_prompt_bp)

