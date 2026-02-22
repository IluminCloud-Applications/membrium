from flask import Blueprint
from .login import login_bp
from .install import install_bp
from .session import session_bp
from .password import password_bp
from .quick_access import quick_access_bp

auth_bp = Blueprint('auth', __name__)

auth_bp.register_blueprint(login_bp)
auth_bp.register_blueprint(install_bp)
auth_bp.register_blueprint(session_bp)
auth_bp.register_blueprint(password_bp)
auth_bp.register_blueprint(quick_access_bp)
