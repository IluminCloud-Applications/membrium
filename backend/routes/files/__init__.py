from flask import Blueprint
from .list import list_bp
from .delete import delete_bp
from .upload import upload_bp
from .disk import disk_bp

files_bp = Blueprint('files', __name__, url_prefix='/api/files')

# Register sub-blueprints
files_bp.register_blueprint(list_bp)
files_bp.register_blueprint(delete_bp)
files_bp.register_blueprint(upload_bp)
files_bp.register_blueprint(disk_bp)
