"""
List files endpoint – returns paginated file list with usage info.
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from datetime import datetime
import os
import re

from routes.files.helpers import get_referenced_filenames, check_file_usage, UPLOADS_DIR
from models import Admin

list_bp = Blueprint('files_list', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@list_bp.route('', methods=['GET'], strict_slashes=False)
@list_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_files():
    page = request.args.get('page', 1, type=int)
    per_page = 12
    file_type = request.args.get('fileType', 'all')
    status = request.args.get('status', 'all')
    search = request.args.get('search', '')

    try:
        physical_files = os.listdir(UPLOADS_DIR)
    except Exception:
        return jsonify({
            'files': [],
            'totalPages': 0,
            'currentPage': page,
            'stats': {'totalFiles': 0, 'unusedFiles': 0, 'totalSize': 0, 'unusedSize': 0}
        })

    refs = get_referenced_filenames()
    all_files = []

    for filename in physical_files:
        file_path = os.path.join(UPLOADS_DIR, filename)
        if not os.path.isfile(file_path):
            continue

        # Type filter
        is_image = bool(re.search(r'\.(jpg|jpeg|png|gif|webp)$', filename, re.IGNORECASE))
        is_document = bool(re.search(r'\.(pdf|doc|docx|xls|xlsx|csv|txt)$', filename, re.IGNORECASE))

        if file_type == 'image' and not is_image:
            continue
        if file_type == 'document' and not is_document:
            continue

        # Search filter
        if search and search.lower() not in filename.lower():
            continue

        # Usage check
        is_used, used_in = check_file_usage(filename, refs)

        # Status filter
        if status == 'used' and not is_used:
            continue
        if status == 'unused' and is_used:
            continue

        try:
            size = os.path.getsize(file_path)
        except Exception:
            size = 0

        try:
            upload_date = datetime.fromtimestamp(os.path.getctime(file_path))
        except Exception:
            upload_date = datetime.now()

        db_doc = refs['db_filenames'].get(filename)
        all_files.append({
            'id': db_doc.id if db_doc else -1,
            'filename': filename,
            'is_used': is_used,
            'used_in': used_in,
            'size': size,
            'upload_date': upload_date.strftime('%Y-%m-%d')
        })

    all_files.sort(key=lambda x: x['upload_date'], reverse=True)

    total_files = len(all_files)
    total_pages = (total_files + per_page - 1) // per_page
    start_idx = (page - 1) * per_page
    paginated_files = all_files[start_idx:start_idx + per_page]

    unused_count = sum(1 for f in all_files if not f['is_used'])
    total_size = sum(f['size'] for f in all_files)
    unused_size = sum(f['size'] for f in all_files if not f['is_used'])

    return jsonify({
        'files': paginated_files,
        'totalPages': total_pages,
        'currentPage': page,
        'stats': {
            'totalFiles': total_files,
            'unusedFiles': unused_count,
            'totalSize': total_size,
            'unusedSize': unused_size,
        }
    })
