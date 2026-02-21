from flask import Blueprint, jsonify, request, session
from functools import wraps
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from db.database import db
from models import Admin, Promotion, PromotionAnalytics
from sqlalchemy import func

crud_bp = Blueprint('promote_crud', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_promotion_status(promotion):
    now = datetime.utcnow()
    if not promotion.is_active:
        return 'inactive'
    elif promotion.start_date > now:
        return 'upcoming'
    elif promotion.end_date < now:
        return 'expired'
    else:
        return 'active'


def serialize_promotion(p, analytics_map=None):
    """Serialize a promotion to a dict with analytics data."""
    views = 0
    clicks = 0
    if analytics_map and p.id in analytics_map:
        views = analytics_map[p.id]['views']
        clicks = analytics_map[p.id]['clicks']

    return {
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'mediaType': p.media_type,
        'mediaUrl': p.media_url,
        'videoSource': p.video_source or 'youtube',
        'startDate': p.start_date.strftime('%Y-%m-%d'),
        'endDate': p.end_date.strftime('%Y-%m-%d'),
        'hasCta': p.has_cta,
        'ctaText': p.cta_text or '',
        'ctaUrl': p.cta_url or '',
        'ctaDelay': p.button_delay or 0,
        'hideVideoControls': p.hide_video_controls,
        'isActive': p.is_active,
        'status': get_promotion_status(p),
        'views': views,
        'clicks': clicks,
        'createdAt': p.created_at.isoformat() if p.created_at else '',
    }


def get_analytics_map():
    """Get a map of promotion_id -> {views, clicks} for all promotions."""
    results = db.session.query(
        PromotionAnalytics.promotion_id,
        func.sum(PromotionAnalytics.views).label('total_views'),
        func.sum(PromotionAnalytics.clicks).label('total_clicks')
    ).group_by(PromotionAnalytics.promotion_id).all()

    return {
        r.promotion_id: {
            'views': r.total_views or 0,
            'clicks': r.total_clicks or 0
        }
        for r in results
    }


@crud_bp.route('', methods=['GET'])
@admin_required
def get_promotions():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')

    query = Promotion.query

    if search:
        query = query.filter(Promotion.title.ilike(f'%{search}%'))

    if status_filter:
        now = datetime.utcnow()
        if status_filter == 'active':
            query = query.filter(
                Promotion.is_active == True,
                Promotion.start_date <= now,
                Promotion.end_date >= now
            )
        elif status_filter == 'inactive':
            query = query.filter(Promotion.is_active == False)
        elif status_filter == 'upcoming':
            query = query.filter(
                Promotion.is_active == True,
                Promotion.start_date > now
            )
        elif status_filter == 'expired':
            query = query.filter(
                Promotion.is_active == True,
                Promotion.end_date < now
            )

    promotions = query.order_by(Promotion.created_at.desc()).paginate(page=page, per_page=per_page)

    # Get analytics for all promotions
    analytics_map = get_analytics_map()

    # Calculate total views/clicks across all promotions
    total_views = sum(a['views'] for a in analytics_map.values())
    total_clicks = sum(a['clicks'] for a in analytics_map.values())

    now = datetime.utcnow()
    active_count = Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).count()

    return jsonify({
        'promotions': [serialize_promotion(p, analytics_map) for p in promotions.items],
        'total_pages': promotions.pages,
        'current_page': page,
        'total': promotions.total,
        'active': active_count,
        'total_views': total_views,
        'total_clicks': total_clicks,
    })


def save_uploaded_image(file):
    """Save an uploaded image and return the filename."""
    uploads_dir = os.path.join('static', 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    filename = f'promotion_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}_{secure_filename(file.filename)}'
    file_path = os.path.join(uploads_dir, filename)
    file.save(file_path)
    return filename


def delete_old_image(media_url):
    """Delete an old promotion image if it exists."""
    if media_url:
        old_file = os.path.join('static', 'uploads', media_url)
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except Exception as e:
                print(f"Failed to delete old image: {str(e)}")


@crud_bp.route('', methods=['POST'])
@admin_required
def create_promotion():
    try:
        data = request.form.to_dict()
        media_type = data.get('mediaType', 'image')
        video_source = data.get('video_source', 'youtube')

        # Handle media upload
        if media_type == 'image':
            if 'media_file' not in request.files:
                return jsonify({'success': False, 'error': 'No media file provided'}), 400
            file = request.files['media_file']
            if file.filename == '':
                return jsonify({'success': False, 'error': 'No file selected'}), 400
            media_url = save_uploaded_image(file)
        elif media_type == 'video':
            media_url = data.get('media_url', '').strip()
            if not media_url:
                return jsonify({'success': False, 'error': 'Video URL/embed is required'}), 400
        else:
            return jsonify({'success': False, 'error': 'Invalid media type'}), 400

        # Process boolean fields
        has_cta = data.get('has_cta', 'false').lower() in ['true', 'on', '1', 'yes']
        hide_video_controls = data.get('hide_video_controls', 'true').lower() in ['true', 'on', '1', 'yes']

        # Force no CTA for custom video sources
        if media_type == 'video' and video_source == 'custom':
            has_cta = False

        # Process button delay
        button_delay = 0
        if media_type == 'video' and 'button_delay' in data and data['button_delay']:
            try:
                button_delay = int(data['button_delay'])
            except ValueError:
                button_delay = 0

        new_promotion = Promotion(
            title=data['title'],
            description=data['description'],
            media_type=media_type,
            media_url=media_url,
            video_source=video_source if media_type == 'video' else None,
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d'),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d'),
            button_delay=button_delay,
            has_cta=has_cta,
            cta_text=data.get('cta_text', '') if has_cta else None,
            cta_url=data.get('cta_url', '') if has_cta else None,
            is_active=False,
            created_at=datetime.utcnow(),
            hide_video_controls=hide_video_controls
        )

        db.session.add(new_promotion)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Promoção criada com sucesso',
            'promotion': serialize_promotion(new_promotion)
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error creating promotion: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@crud_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_promotion(id):
    promotion = Promotion.query.get_or_404(id)

    try:
        data = request.form.to_dict()
        media_type = data.get('mediaType', data.get('media_type', promotion.media_type))
        video_source = data.get('video_source', promotion.video_source or 'youtube')

        # Handle media update
        if media_type == 'image':
            if 'media_file' in request.files and request.files['media_file'].filename:
                if promotion.media_type == 'image':
                    delete_old_image(promotion.media_url)
                promotion.media_url = save_uploaded_image(request.files['media_file'])
            promotion.media_type = 'image'
            promotion.video_source = None
        elif media_type == 'video':
            media_url = data.get('media_url', '').strip()
            if media_url:
                promotion.media_url = media_url
            promotion.media_type = 'video'
            promotion.video_source = video_source

        # Process boolean fields
        has_cta = data.get('has_cta', 'false').lower() in ['true', 'on', '1', 'yes']
        hide_video_controls = data.get('hide_video_controls', 'true').lower() in ['true', 'on', '1', 'yes']

        # Force no CTA for custom video sources
        if media_type == 'video' and video_source == 'custom':
            has_cta = False

        # Process button delay
        button_delay = 0
        if media_type == 'video' and 'button_delay' in data and data['button_delay']:
            try:
                button_delay = int(data['button_delay'])
            except ValueError:
                button_delay = 0

        promotion.title = data['title']
        promotion.description = data['description']
        promotion.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        promotion.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
        promotion.button_delay = button_delay
        promotion.has_cta = has_cta
        promotion.cta_text = data.get('cta_text', '') if has_cta else None
        promotion.cta_url = data.get('cta_url', '') if has_cta else None
        promotion.hide_video_controls = hide_video_controls

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Promoção atualizada com sucesso',
            'promotion': serialize_promotion(promotion)
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error updating promotion: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@crud_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_promotion(id):
    promotion = Promotion.query.get_or_404(id)

    try:
        if promotion.media_type == 'image':
            delete_old_image(promotion.media_url)

        # Delete analytics
        PromotionAnalytics.query.filter_by(promotion_id=id).delete()

        db.session.delete(promotion)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Promoção excluída com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/<int:id>/toggle', methods=['POST'])
@admin_required
def toggle_promotion(id):
    promotion = Promotion.query.get_or_404(id)
    promotion.is_active = not promotion.is_active

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Promoção {"ativada" if promotion.is_active else "desativada"} com sucesso',
            'is_active': promotion.is_active
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/active', methods=['GET'])
def get_active_promotions():
    """Public endpoint for students — get currently active promotions."""
    now = datetime.utcnow()
    promotions = Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).all()

    if not promotions:
        return jsonify({'success': False, 'message': 'No active promotions'})

    return jsonify({
        'success': True,
        'promotions': [{
            'id': promo.id,
            'title': promo.title,
            'description': promo.description,
            'mediaType': promo.media_type,
            'mediaUrl': promo.media_url,
            'videoSource': promo.video_source,
            'hasCta': promo.has_cta,
            'ctaText': promo.cta_text,
            'ctaUrl': promo.cta_url,
            'ctaDelay': promo.button_delay,
            'hideVideoControls': promo.hide_video_controls,
        } for promo in promotions]
    })
