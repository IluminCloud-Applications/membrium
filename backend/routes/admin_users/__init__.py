from flask import Blueprint
from .crud import admin_users_bp

admin_users_root_bp = Blueprint('admin_users_root', __name__)
admin_users_root_bp.register_blueprint(admin_users_bp)
