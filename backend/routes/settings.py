from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from db.database import db
from models import Admin, Settings
from db.utils import get_or_create_settings, check_installation

settings_bp = Blueprint('settings', __name__)

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

@settings_bp.route('/admin/settings')
@admin_required
@installation_required
def settings():
    # Verificar se o usuário atual é realmente um administrador
    current_user_id = session.get('user_id')
    current_user = Admin.query.get(current_user_id)
    
    if not current_user:
        abort(403)  # Forbidden

    # Obter as configurações atuais ou criar se não existirem
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()
        
    return render_template('settings.html', settings=settings, admin_email=current_user.email)

@settings_bp.route('/api/settings', methods=['GET'])
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
        'admin_email': admin.email,
        'support_email': settings.support_email,
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
        'groq': {
            'enabled': settings.groq_api_enabled,
            'api_key': settings.groq_api
        },
        'openai': {
            'enabled': settings.openai_api_enabled,
            'api_key': settings.openai_api
        }
    })

@settings_bp.route('/api/settings/platform', methods=['POST'])
@admin_required
def update_platform_settings():
    data = request.form
    platform_name = data.get('platform_name')
    
    if not platform_name:
        return jsonify({'success': False, 'message': 'Nome da plataforma é obrigatório'}), 400
    
    admin = Admin.query.first()
    if admin:
        admin.platform_name = platform_name
        db.session.commit()
        return jsonify({'success': True, 'message': 'Nome da plataforma atualizado com sucesso'})
    else:
        return jsonify({'success': False, 'message': 'Administrador não encontrado'}), 404

@settings_bp.route('/api/settings/support', methods=['POST'])
@admin_required
def update_support_email():
    data = request.form
    support_email = data.get('support_email')
    
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    
    settings.support_email = support_email
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Email de suporte atualizado com sucesso'})

@settings_bp.route('/api/settings/brevo', methods=['POST'])
@admin_required
def update_brevo_settings():
    data = request.form
    enabled = data.get('enabled', 'false').lower() == 'true'
    api_key = data.get('api_key')
    email_subject = data.get('email_subject')
    email_template = data.get('email_template')
    sender_name = data.get('sender_name')
    sender_email = data.get('sender_email')
    
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    
    settings.brevo_enabled = enabled
    
    if enabled and not api_key:
        return jsonify({'success': False, 'message': 'API Key é obrigatória quando Brevo está habilitado'}), 400
    
    if enabled:
        settings.brevo_api_key = api_key
        settings.brevo_email_subject = email_subject
        settings.brevo_email_template = email_template
        settings.sender_name = sender_name
        settings.sender_email = sender_email
    else:
        # When disabled, clear out the settings
        settings.brevo_api_key = None
        # Preserve the template and other settings for when the integration is re-enabled
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Configurações da Brevo atualizadas com sucesso'})

@settings_bp.route('/api/settings/evolution', methods=['POST'])
@admin_required
def update_evolution_settings():
    data = request.form
    enabled = data.get('enabled', 'false').lower() == 'true'
    url = data.get('url')
    api_key = data.get('api_key')
    message_template = data.get('message_template')
    version = data.get('version')  # New field for API version
    instance = data.get('instance')  # New field for WhatsApp instance
    
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    
    settings.evolution_enabled = enabled
    
    if enabled:
        if not url:
            return jsonify({'success': False, 'message': 'URL é obrigatória quando Evolution API está habilitada'}), 400
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando Evolution API está habilitada'}), 400
        if not version:
            return jsonify({'success': False, 'message': 'Versão da API é obrigatória'}), 400
        if not instance:
            return jsonify({'success': False, 'message': 'Instância do WhatsApp é obrigatória'}), 400
        
        settings.evolution_url = url
        settings.evolution_api_key = api_key
        settings.evolution_message_template = message_template
        settings.evolution_version = version  # Save the API version
        settings.evolution_instance = instance  # Save the WhatsApp instance
    else:
        # When disabled, clear out the settings
        settings.evolution_api_key = None
        # Preserve the template and other settings for when the integration is re-enabled
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Configurações da Evolution API atualizadas com sucesso'})

@settings_bp.route('/api/settings/groq', methods=['POST'])
@admin_required
def update_groq_settings():
    data = request.form
    enabled = data.get('enabled', 'false').lower() == 'true'
    api_key = data.get('api_key')
    
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    
    settings.groq_api_enabled = enabled
    # Se estiver ativado, salva a chave; senão, limpa a chave
    if enabled:
        settings.groq_api = api_key
    else:
        settings.groq_api = None
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Configurações da GROQ AI atualizadas com sucesso'})

@settings_bp.route('/api/settings/openai', methods=['POST'])
@admin_required
def update_openai_settings():
    data = request.form
    enabled = data.get('enabled', 'false').lower() == 'true'
    api_key = data.get('api_key')
    
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
    
    settings.openai_api_enabled = enabled
    # Se estiver ativado, salva a chave; senão, limpa a chave
    if enabled:
        settings.openai_api = api_key
    else:
        settings.openai_api = None
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Configurações da OpenAI atualizadas com sucesso'})

@settings_bp.route('/api/settings/admin', methods=['POST'])
@admin_required
def update_admin_settings():
    data = request.form
    email = data.get('email')
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    admin = Admin.query.first()
    
    if not admin:
        return jsonify({'success': False, 'message': 'Administrador não encontrado'}), 404
    
    # Atualizar email se fornecido
    if email and email != admin.email:
        admin.email = email
    
    # Atualizar senha se fornecida
    if current_password and new_password:
        if check_password_hash(admin.password, current_password):
            admin.password = generate_password_hash(new_password)
        else:
            return jsonify({'success': False, 'message': 'Senha atual incorreta'}), 400
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Informações do administrador atualizadas com sucesso'})

# API endpoint para obter email de suporte
@settings_bp.route('/api/support-email')
def get_support_email():
    settings = Settings.query.first()
    if settings and settings.support_email:
        return jsonify({
            'success': True,
            'support_email': settings.support_email
        })
    return jsonify({
        'success': False,
        'support_email': None
    })
