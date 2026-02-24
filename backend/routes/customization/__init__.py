from flask import Blueprint
from .login import login_customization_bp

customization_bp = Blueprint('customization', __name__)

# Register sub-blueprints
customization_bp.register_blueprint(login_customization_bp)
