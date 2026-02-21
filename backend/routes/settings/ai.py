from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Admin, Settings

ai_bp = Blueprint('settings_ai', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ─── Groq AI ──────────────────────────────────────────────────────

@ai_bp.route('/api/settings/groq', methods=['POST'])
@admin_required
def update_groq():
    data = request.json or request.form
    enabled = data.get('enabled', 'false')
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    api_key = data.get('api_key')

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.groq_api_enabled = enabled
    settings.groq_api = api_key if enabled else None
    db.session.commit()

    return jsonify({'success': True, 'message': 'Configurações da GROQ AI atualizadas com sucesso'})


# ─── OpenAI ───────────────────────────────────────────────────────

@ai_bp.route('/api/settings/openai', methods=['POST'])
@admin_required
def update_openai():
    data = request.json or request.form
    enabled = data.get('enabled', 'false')
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    api_key = data.get('api_key')

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.openai_api_enabled = enabled
    settings.openai_api = api_key if enabled else None
    db.session.commit()

    return jsonify({'success': True, 'message': 'Configurações da OpenAI atualizadas com sucesso'})
