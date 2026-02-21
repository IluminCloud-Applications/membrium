from flask import Blueprint
from .crud import crud_bp
from .stats import stats_bp
from .selectors import selectors_bp

faq_bp = Blueprint('faq', __name__, url_prefix='/api/faq')

# Register sub-blueprints
faq_bp.register_blueprint(crud_bp)
faq_bp.register_blueprint(stats_bp)
faq_bp.register_blueprint(selectors_bp)
