from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from datetime import datetime
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Promotion, Showcase, ShowcaseAnalytics
from db.utils import check_installation

misc_bp = Blueprint('misc', __name__)

def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
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

# API endpoint para obter cursos em destaque (showcase)
@misc_bp.route('/api/showcase-courses')
@student_required
def get_showcase_courses():
    # Obter todos os cursos ativos na vitrine
    active_showcase = Showcase.query.filter_by(status='active').all()
    
    return jsonify({
        'success': True,
        'courses': [{
            'id': item.id,
            'course_id': item.course_id,
            'name': item.name,
            'description': item.description,
            'image': item.image,
            'button_text': item.button_text,
            'button_link': item.button_link,
            'price': item.price,
            'has_video': item.has_video,
            'video_url': item.video_url,
            'priority': item.priority,
            'button_delay': item.button_delay
        } for item in active_showcase]
    })

# Add this new API endpoint after your other showcase endpoints
@misc_bp.route('/api/showcase/analytics')
def get_showcase_analytics():
    try:
        # Get analytics for the current date
        today = datetime.now().date()
        analytics = ShowcaseAnalytics.query.filter_by(date=today).all()
        
        return jsonify({
            'success': True,
            'analytics': [{
                'showcase_id': analytic.showcase_id,
                'views': analytic.views,
                'conversions': analytic.conversions,
                'date': analytic.date.isoformat()
            } for analytic in analytics]
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Add this new endpoint for total showcase analytics (all time)
@misc_bp.route('/api/showcase/analytics/total')
@admin_required
def get_total_showcase_analytics():
    try:
        # Get total analytics for all time
        from sqlalchemy import func
        total_analytics = db.session.query(
            ShowcaseAnalytics.showcase_id,
            func.sum(ShowcaseAnalytics.views).label('total_views'),
            func.sum(ShowcaseAnalytics.conversions).label('total_conversions')
        ).group_by(ShowcaseAnalytics.showcase_id).all()
        
        return jsonify({
            'success': True,
            'analytics': [{
                'showcase_id': analytic.showcase_id,
                'total_views': analytic.total_views or 0,
                'total_conversions': analytic.total_conversions or 0
            } for analytic in total_analytics]
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@misc_bp.route('/admin/promote')
@admin_required
@installation_required
def promote_panel():
    current_user_id = session.get('user_id')
    current_user = Admin.query.get(current_user_id)
    
    if not current_user:
        abort(403)  # Forbidden

    return render_template('promote.html')

@misc_bp.route('/admin/showcase')
@admin_required
@installation_required
def showcase_panel():
    # Verify the current user is an administrator
    current_user_id = session.get('user_id')
    current_user = Admin.query.get(current_user_id)
    
    if not current_user:
        abort(403)  # Forbidden

    return render_template('showcase.html')

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
