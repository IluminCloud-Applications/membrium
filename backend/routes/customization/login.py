"""
Login customization routes — public GET + admin PUT/upload.
Structured as global fields + per-device (desktop/mobile) configs.
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from werkzeug.utils import secure_filename
import os
import uuid

from db.database import db
from sqlalchemy.orm.attributes import flag_modified
from models import Admin, Customization
from db.utils import ensure_upload_directory

login_customization_bp = Blueprint('login_customization', __name__)

UPLOADS_DIR = os.path.join('static', 'uploads')

# ─── Defaults ────────────────────────────────────────────────

DEFAULT_DEVICE_CONFIG = {
    'background_image': None,
    'background_color': '#1f1f1f',
    'card_color': '#2b2b2b',
    'button_color': '#E62020',
    'button_text_color': '#ffffff',
    'text_color': '#f2f2f2',
    'overlay_opacity': 50,
}

DEFAULT_LOGIN_PAGE = {
    'layout': 'simple',
    'logo': None,
    'subtitle': 'Faça login para acessar sua área de membros',
    'custom_css': None,
    'desktop': {**DEFAULT_DEVICE_CONFIG},
    'mobile': {**DEFAULT_DEVICE_CONFIG},
}

GLOBAL_ALLOWED = {'layout', 'logo', 'subtitle', 'custom_css'}
DEVICE_ALLOWED = set(DEFAULT_DEVICE_CONFIG.keys())


# ─── Helpers ─────────────────────────────────────────────────

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_or_create_customization():
    custom = Customization.query.first()
    if not custom:
        custom = Customization(login_page={}, member_area={})
        db.session.add(custom)
        db.session.commit()
    return custom


def merge_with_defaults(stored):
    """Merge stored login_page with full defaults."""
    result = {**DEFAULT_LOGIN_PAGE}
    if not stored:
        return result

    for key in GLOBAL_ALLOWED:
        if key in stored:
            result[key] = stored[key]

    for device in ('desktop', 'mobile'):
        result[device] = {**DEFAULT_DEVICE_CONFIG}
        if device in stored and isinstance(stored[device], dict):
            for k in DEVICE_ALLOWED:
                if k in stored[device]:
                    result[device][k] = stored[device][k]

    return result


# ─── PUBLIC: Get login customization ─────────────────────────

@login_customization_bp.route('/api/customization/login', methods=['GET'])
def get_login_customization():
    custom = Customization.query.first()
    if not custom:
        return jsonify(DEFAULT_LOGIN_PAGE)
    return jsonify(merge_with_defaults(custom.login_page))


# ─── ADMIN: Update login customization ──────────────────────

@login_customization_bp.route('/api/customization/login', methods=['PUT'])
@admin_required
def update_login_customization():
    data = request.json or {}
    custom = get_or_create_customization()
    current = custom.login_page or {}

    # Global fields
    for key in GLOBAL_ALLOWED:
        if key in data:
            current[key] = data[key]

    # Device configs
    for device in ('desktop', 'mobile'):
        if device in data and isinstance(data[device], dict):
            if device not in current:
                current[device] = {}
            for key in DEVICE_ALLOWED:
                if key in data[device]:
                    current[device][key] = data[device][key]

    custom.login_page = current
    flag_modified(custom, 'login_page')
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Personalização do login atualizada',
        'data': merge_with_defaults(current),
    })


# ─── ADMIN: Upload image (just saves file, returns filename) ─

@login_customization_bp.route('/api/customization/login/upload', methods=['POST'])
@admin_required
def upload_login_image():
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400

    ensure_upload_directory()
    ext = os.path.splitext(file.filename)[1].lower() or '.jpg'
    filename = secure_filename(f"login_{uuid.uuid4().hex[:8]}{ext}")
    filepath = os.path.join(UPLOADS_DIR, filename)
    file.save(filepath)

    return jsonify({
        'success': True,
        'message': 'Imagem enviada com sucesso',
        'filename': filename,
    })


# ─── ADMIN: Delete image file ───────────────────────────────

@login_customization_bp.route('/api/customization/login/image/<filename>', methods=['DELETE'])
@admin_required
def delete_login_image(filename):
    safe = secure_filename(filename)
    filepath = os.path.join(UPLOADS_DIR, safe)
    if os.path.exists(filepath):
        os.remove(filepath)
    return jsonify({'success': True, 'message': 'Imagem removida'})
