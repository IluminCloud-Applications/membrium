from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from datetime import datetime
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Promotion

misc_bp = Blueprint('misc', __name__)

def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from db.utils import check_installation
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function

def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

# API endpoint para obter promoções ativas
@misc_bp.route('/api/active-promotions')
@student_required
def get_active_promotions():
    now = datetime.utcnow()
    active_promotions = Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).all()
    
    return jsonify({
        'success': True,
        'promotions': [{
            'id': promo.id,
            'title': promo.title,
            'description': promo.description,
            'media_type': promo.media_type,
            'media_url': promo.media_url,
            'has_cta': promo.has_cta,
            'cta_text': promo.cta_text,
            'cta_url': promo.cta_url,
            'button_delay': promo.button_delay,
            'hide_video_controls': promo.hide_video_controls
        } for promo in active_promotions]
    })

@misc_bp.route('/admin/promote')
@admin_required
@installation_required
def promote_panel():
    current_user_id = session.get('user_id')
    current_user = Admin.query.get(current_user_id)
    
    if not current_user:
        abort(403)

    return render_template('promote.html')

# Add this new route to get support email
@misc_bp.route('/api/support-email')
def get_support_email():
    from db.utils import get_or_create_settings
    settings = get_or_create_settings()
    
    if settings.support_email:
        return jsonify({
            'success': True,
            'support_email': settings.support_email
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Email de suporte não configurado'
        })
