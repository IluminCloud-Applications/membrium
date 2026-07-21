from flask import Blueprint, request, jsonify, session
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from db.database import db
from models import Admin
from db.integration_helpers import get_integration, set_integration

general_bp = Blueprint('settings_general', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def full_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Acesso não autorizado.'}), 403
        admin = Admin.query.get(session['user_id'])
        if not admin:
            return jsonify({'error': 'Acesso não autorizado.'}), 403
        if admin.role != 'admin':
            return jsonify({'error': 'Permissão insuficiente. Apenas administradores completos podem acessar este recurso.'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ─── GET all settings ────────────────────────────────────────────

@general_bp.route('/api/settings', methods=['GET'])
@admin_required
def get_settings():
    admin = Admin.query.first()

    support_enabled, support = get_integration('support')
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    gemini_enabled, gemini = get_integration('gemini')
    openai_enabled, openai = get_integration('openai')
    _, signup_config = get_integration('student_signup')

    return jsonify({
        'platform_name': admin.platform_name,
        'admin_email': admin.email,
        'admin_name': admin.name or '',
        'support_email': support.get('email', ''),
        'support_whatsapp': support.get('whatsapp', ''),
        'new_student_password': signup_config.get('new_student_password', ''),
        'brevo': {
            'enabled': brevo_enabled,
            'api_key': brevo.get('api_key'),
            'email_subject': brevo.get('email_subject'),
            'email_template': brevo.get('email_template'),
            'sender_name': support.get('sender_name'),
            'sender_email': support.get('sender_email'),
        },
        'evolution': {
            'enabled': evolution_enabled,
            'url': evolution.get('url'),
            'api_key': evolution.get('api_key'),
            'message_template': evolution.get('message_template'),
            'version': evolution.get('version'),
            'instance': evolution.get('instance'),
        },
        'gemini': {
            'enabled': gemini_enabled,
            'api_key': gemini.get('api_key'),
        },
        'openai': {
            'enabled': openai_enabled,
            'api_key': openai.get('api_key'),
        },
    })


# ─── Platform name ───────────────────────────────────────────────

@general_bp.route('/api/settings/platform', methods=['POST'])
@full_admin_required
def update_platform():
    data = request.json or request.form
    platform_name = data.get('platform_name')

    if not platform_name:
        return jsonify({'success': False, 'message': 'Nome da plataforma é obrigatório'}), 400

    admin = Admin.query.first()
    if not admin:
        return jsonify({'success': False, 'message': 'Administrador não encontrado'}), 404

    admin.platform_name = platform_name

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da plataforma atualizadas com sucesso'})


# ─── Admin info (name, email, password) ──────────────────────────

@general_bp.route('/api/settings/admin', methods=['POST'])
@full_admin_required
def update_admin():
    data = request.json or request.form
    email = data.get('email')
    name = data.get('name')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    admin = Admin.query.get(session['user_id'])
    if not admin:
        return jsonify({'success': False, 'message': 'Administrador não encontrado'}), 404

    # Update name
    if name is not None:
        admin.name = name.strip() or None

    # Update email
    if email and email != admin.email:
        admin.email = email

    # Update password (only if both provided)
    if current_password and new_password:
        if check_password_hash(admin.password, current_password):
            admin.password = generate_password_hash(new_password)
        else:
            return jsonify({'success': False, 'message': 'Senha atual incorreta'}), 400

    db.session.commit()
    return jsonify({'success': True, 'message': 'Informações do administrador atualizadas com sucesso'})


# ─── Support (email + whatsapp) ──────────────────────────────────

@general_bp.route('/api/settings/support', methods=['POST'])
@admin_required
def update_support():
    data = request.json or request.form

    _, current = get_integration('support')
    current['email'] = data.get('support_email', '')
    current['whatsapp'] = data.get('support_whatsapp', '')

    set_integration('support', True, current)
    return jsonify({'success': True, 'message': 'Suporte atualizado com sucesso'})


# ─── Student Signup Settings ─────────────────────────────────────

@general_bp.route('/api/settings/student-signup', methods=['POST'])
@admin_required
def update_student_signup():
    data = request.json or request.form
    new_student_password = data.get('new_student_password', '').strip()

    set_integration('student_signup', True, {'new_student_password': new_student_password})
    return jsonify({'success': True, 'message': 'Configurações de cadastro de alunos atualizadas com sucesso'})


# ─── Public support email endpoint ───────────────────────────────

@general_bp.route('/api/support-email')
def get_support_email():
    _, support = get_integration('support')
    email = support.get('email')
    if email:
        return jsonify({'success': True, 'support_email': email})
    return jsonify({'success': False, 'support_email': None})


# ─── Global platform menu ─────────────────────────────────────────

@general_bp.route('/api/settings/menu', methods=['GET'])
@admin_required
def get_global_menu():
    """Get the global menu items for the member area."""
    _, config = get_integration('menu')
    return jsonify({'menu_items': config.get('items', [])})


@general_bp.route('/api/settings/menu', methods=['PUT', 'POST'])
@admin_required
def update_global_menu():
    """Replace global menu items for the member area."""
    data = request.get_json()
    if data is None:
        return jsonify({'success': False, 'message': 'Body inválido'}), 400

    items = data.get('items', [])
    set_integration('menu', True, {'items': items})
    return jsonify({'success': True, 'menu_items': items})


@general_bp.route('/api/member/menu', methods=['GET'])
def get_global_menu_public():
    """Public endpoint: returns global menu items for the member area."""
    _, config = get_integration('menu')
    return jsonify({'menu_items': config.get('items', [])})
