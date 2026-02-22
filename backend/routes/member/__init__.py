from flask import Blueprint
from .courses import member_courses_bp
from .profile import member_profile_bp
from .progress import member_progress_bp
from .lessons import member_lessons_bp

member_bp = Blueprint('member', __name__, url_prefix='/api/member')

member_bp.register_blueprint(member_courses_bp)
member_bp.register_blueprint(member_profile_bp)
member_bp.register_blueprint(member_progress_bp)
member_bp.register_blueprint(member_lessons_bp)
