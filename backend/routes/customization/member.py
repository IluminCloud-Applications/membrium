"""
Member area customization routes.
Stores member_custom_css and visual settings inside the existing member_area JSONB column.
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps

from db.database import db
from sqlalchemy.orm.attributes import flag_modified
from models import Admin, Customization

member_customization_bp = Blueprint('member_customization', __name__)

DEFAULT_MEMBER_AREA = {
    'member_custom_css': '',
    'hide_module_info': False,
}

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
    result = {**DEFAULT_MEMBER_AREA}
    if not stored:
        return result
    for key in DEFAULT_MEMBER_AREA:
        if key in stored:
            result[key] = stored[key]
    return result


# ─── PUBLIC: Get member CSS and config ───────────────────────

@member_customization_bp.route('/api/customization/member', methods=['GET'])
def get_member_customization():
    custom = Customization.query.first()
    if not custom:
        return jsonify(DEFAULT_MEMBER_AREA)

    return jsonify(merge_with_defaults(custom.member_area))


# ─── ADMIN: Update member customization ──────────────────────

@member_customization_bp.route('/api/customization/member', methods=['PUT'])
@admin_required
def update_member_customization():
    data = request.get_json() or {}
    custom = get_or_create_customization()

    member_area = dict(custom.member_area or {})
    
    for key in DEFAULT_MEMBER_AREA:
        if key in data:
            member_area[key] = data[key]

    custom.member_area = member_area
    flag_modified(custom, 'member_area')
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Tema da área de membros atualizado com sucesso',
        'data': merge_with_defaults(member_area),
    })
