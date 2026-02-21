"""
Delete file endpoint(s) – single file and bulk clean unused.
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
import os

from routes.files.helpers import get_referenced_filenames, check_file_usage, UPLOADS_DIR
from db.database import db
from models import Admin, Document

delete_bp = Blueprint('files_delete', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@delete_bp.route('/<path:file_id>', methods=['DELETE'])
@admin_required
def delete_file(file_id):
    try:
        if file_id == '-1':
            filename = request.args.get('filename')
            if not filename:
                return jsonify({'success': False, 'message': 'Nome do arquivo é obrigatório'}), 400

            file_path = os.path.join(UPLOADS_DIR, filename)
            if not os.path.exists(file_path):
                return jsonify({'success': False, 'message': 'Arquivo não encontrado'}), 404

            refs = get_referenced_filenames()
            is_used, _ = check_file_usage(filename, refs)

            if is_used:
                return jsonify({'success': False, 'message': 'Arquivo está sendo usado e não pode ser excluído'}), 400

            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Arquivo excluído com sucesso'})
        else:
            document = Document.query.get_or_404(file_id)
            file_path = os.path.join(UPLOADS_DIR, document.filename)
            if os.path.exists(file_path):
                os.remove(file_path)

            db.session.delete(document)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Arquivo excluído com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@delete_bp.route('/clean-unused', methods=['DELETE'])
@admin_required
def clean_unused_files():
    """Delete all files not referenced by any entity."""
    try:
        physical_files = os.listdir(UPLOADS_DIR)
        refs = get_referenced_filenames()

        deleted = 0
        freed_space = 0

        for filename in physical_files:
            file_path = os.path.join(UPLOADS_DIR, filename)
            if not os.path.isfile(file_path):
                continue

            is_used, _ = check_file_usage(filename, refs)

            if not is_used:
                try:
                    size = os.path.getsize(file_path)
                    os.remove(file_path)
                    deleted += 1
                    freed_space += size
                except Exception:
                    pass

        return jsonify({
            'success': True,
            'deleted': deleted,
            'freedSpace': freed_space
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
