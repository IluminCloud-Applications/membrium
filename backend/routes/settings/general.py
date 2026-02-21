from flask import Blueprint, render_template, request, redirect, url_for, jsonify, session, abort
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from db.database import db
from models import Admin, Settings
from db.utils import get_or_create_settings, check_installation

general_bp = Blueprint('settings_general', __name__)


def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ─── Legacy template route ───────────────────────────────────────

@general_bp.route('/admin/settings')
@admin_required
@installation_required
def settings_page():
    current_user = Admin.query.get(session.get('user_id'))
    if not current_user:
        abort(403)

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()

    return render_template(
        'settings.html',
        settings=settings,
        admin_email=current_user.email,
    )


# ─── GET all settings ────────────────────────────────────────────

@general_bp.route('/api/settings', methods=['GET'])
@admin_required
def get_settings():
    settings = Settings.query.first()
    admin = Admin.query.first()

    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        'platform_name': admin.platform_name,
        'default_theme': settings.default_theme or 'light',
        'admin_email': admin.email,
        'admin_name': admin.name or '',
        'support_email': settings.support_email or '',
        'support_whatsapp': settings.support_whatsapp or '',
        'brevo': {
            'enabled': settings.brevo_enabled,
            'api_key': settings.brevo_api_key,
            'email_subject': settings.brevo_email_subject,
            'email_template': settings.brevo_email_template,
            'sender_name': settings.sender_name,
            'sender_email': settings.sender_email
        },
        'evolution': {
            'enabled': settings.evolution_enabled,
            'url': settings.evolution_url,
            'api_key': settings.evolution_api_key,
            'message_template': settings.evolution_message_template,
            'version': settings.evolution_version,
            'instance': settings.evolution_instance
        },
        'gemini': {
            'enabled': settings.gemini_api_enabled,
            'api_key': settings.gemini_api_key
        },
        'openai': {
            'enabled': settings.openai_api_enabled,
            'api_key': settings.openai_api
        }
    })


# ─── Platform name ───────────────────────────────────────────────

@general_bp.route('/api/settings/platform', methods=['POST'])
@admin_required
def update_platform():
    data = request.json or request.form
    platform_name = data.get('platform_name')
    default_theme = data.get('default_theme')

    if not platform_name:
        return jsonify({'success': False, 'message': 'Nome da plataforma é obrigatório'}), 400

    admin = Admin.query.first()
    if not admin:
        return jsonify({'success': False, 'message': 'Administrador não encontrado'}), 404

    admin.platform_name = platform_name

    # Update default theme
    if default_theme in ('light', 'dark'):
        settings = Settings.query.first()
        if not settings:
            settings = Settings()
            db.session.add(settings)
        settings.default_theme = default_theme

    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações da plataforma atualizadas com sucesso'})


# ─── Admin info (name, email, password) ──────────────────────────

@general_bp.route('/api/settings/admin', methods=['POST'])
@admin_required
def update_admin():
    data = request.json or request.form
    email = data.get('email')
    name = data.get('name')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    admin = Admin.query.first()
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
    support_email = data.get('support_email')
    support_whatsapp = data.get('support_whatsapp')

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.support_email = support_email
    settings.support_whatsapp = support_whatsapp
    db.session.commit()

    return jsonify({'success': True, 'message': 'Suporte atualizado com sucesso'})


# ─── Public support email endpoint ───────────────────────────────

@general_bp.route('/api/support-email')
def get_support_email():
    settings = Settings.query.first()
    if settings and settings.support_email:
        return jsonify({'success': True, 'support_email': settings.support_email})
    return jsonify({'success': False, 'support_email': None})
