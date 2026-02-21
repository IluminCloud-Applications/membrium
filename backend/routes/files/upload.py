"""
Upload endpoints – cover images for courses.
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from werkzeug.utils import secure_filename
import os

from routes.files.helpers import UPLOADS_DIR
from db.utils import ensure_upload_directory
from models import Admin

upload_bp = Blueprint('files_upload', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@upload_bp.route('/upload_cover', methods=['POST'])
@admin_required
def upload_cover():
    course_id = request.form.get('course_id')
    file_desktop = request.files.get('file')
    file_mobile = request.files.get('file_mobile')

    if not file_desktop and not file_mobile:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})

    saved = False

    if file_desktop and file_desktop.filename:
        ensure_upload_directory()
        filename = secure_filename(f"cover_{course_id}.jpg")
        file_desktop.save(os.path.join(UPLOADS_DIR, filename))
        saved = True

    if file_mobile and file_mobile.filename:
        ensure_upload_directory()
        filename_mobile = secure_filename(f"cover_{course_id}_mobile.jpg")
        file_mobile.save(os.path.join(UPLOADS_DIR, filename_mobile))
        saved = True

    if saved:
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Upload falhou'})


@upload_bp.route('/cover', methods=['DELETE'])
@admin_required
def delete_cover():
    course_id = request.args.get('course_id')
    if not course_id:
        return jsonify({'success': False, 'message': 'ID do curso não fornecido'}), 400

    filename = f"cover_{course_id}.jpg"
    file_path = os.path.join(UPLOADS_DIR, filename)

    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Arquivo não encontrado'}), 404
