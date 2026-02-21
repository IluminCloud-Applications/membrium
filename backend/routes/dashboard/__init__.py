from flask import Blueprint
from .stats import stats_bp
from .chart import chart_bp
from .recent_students import recent_students_bp
from .user_info import user_info_bp

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

# Register sub-blueprints
dashboard_bp.register_blueprint(stats_bp)
dashboard_bp.register_blueprint(chart_bp)
dashboard_bp.register_blueprint(recent_students_bp)
dashboard_bp.register_blueprint(user_info_bp)
