from flask import Blueprint, jsonify, session
from datetime import datetime, date
from models import Student, Promotion, PromotionAnalytics
from db.database import db
from .auth_helpers import member_or_preview

member_promotions_bp = Blueprint('member_promotions', __name__)


@member_promotions_bp.route('/promotions/active', methods=['GET'])
@member_or_preview
def get_active_promotions(student):
    """Returns all currently active promotions for the member modal queue."""
    now = datetime.utcnow()

    promotions = Promotion.query.filter(
        Promotion.is_active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).order_by(Promotion.created_at.desc()).all()

    result = []
    for promo in promotions:
        media_url = promo.media_url
        if promo.media_type == 'image' and media_url:
            media_url = f'/static/uploads/{media_url}'

        result.append({
            'id': promo.id,
            'title': promo.title,
            'description': promo.description,
            'mediaType': promo.media_type,
            'mediaUrl': media_url,
            'videoSource': promo.video_source,
            'hasCta': promo.has_cta,
            'ctaText': promo.cta_text or '',
            'ctaUrl': promo.cta_url or '',
            'ctaDelay': promo.button_delay or 0,
            'hideVideoControls': promo.hide_video_controls,
        })

    return jsonify({'promotions': result})


@member_promotions_bp.route('/promotions/<int:promo_id>/view', methods=['POST'])
@member_or_preview
def track_promo_view(student, promo_id):
    """Track a view for a promotion. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = PromotionAnalytics.query.filter_by(
        promotion_id=promo_id, date=today
    ).first()

    if analytics:
        analytics.views += 1
    else:
        analytics = PromotionAnalytics(
            promotion_id=promo_id, date=today, views=1, clicks=0
        )
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})


@member_promotions_bp.route('/promotions/<int:promo_id>/click', methods=['POST'])
@member_or_preview
def track_promo_click(student, promo_id):
    """Track a CTA click for a promotion. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = PromotionAnalytics.query.filter_by(
        promotion_id=promo_id, date=today
    ).first()

    if analytics:
        analytics.clicks += 1
    else:
        analytics = PromotionAnalytics(
            promotion_id=promo_id, date=today, views=0, clicks=1
        )
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})
