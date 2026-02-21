from flask import Blueprint, jsonify, session
from functools import wraps
from datetime import datetime
from sqlalchemy import func
from db.database import db
from models import Admin, PromotionAnalytics
from pytz import timezone

analytics_bp = Blueprint('promote_analytics', __name__)

SP_TZ = timezone('America/Sao_Paulo')


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@analytics_bp.route('/<int:promotion_id>/analytics/view', methods=['POST'])
def track_view(promotion_id):
    """Increment view count for a promotion (public endpoint)."""
    try:
        today = datetime.now(SP_TZ).date()
        record = PromotionAnalytics.query.filter_by(
            promotion_id=promotion_id, date=today
        ).first()

        if record:
            record.views += 1
        else:
            record = PromotionAnalytics(
                promotion_id=promotion_id, date=today, views=1, clicks=0
            )
            db.session.add(record)

        db.session.commit()
        return jsonify({'success': True, 'views': record.views})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/<int:promotion_id>/analytics/click', methods=['POST'])
def track_click(promotion_id):
    """Increment click count for a promotion (public endpoint)."""
    try:
        today = datetime.now(SP_TZ).date()
        record = PromotionAnalytics.query.filter_by(
            promotion_id=promotion_id, date=today
        ).first()

        if record:
            record.clicks += 1
        else:
            record = PromotionAnalytics(
                promotion_id=promotion_id, date=today, views=0, clicks=1
            )
            db.session.add(record)

        db.session.commit()
        return jsonify({'success': True, 'clicks': record.clicks})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/analytics/total', methods=['GET'])
@admin_required
def get_total_analytics():
    """Get total analytics for all promotions (all time)."""
    try:
        total_analytics = db.session.query(
            PromotionAnalytics.promotion_id,
            func.sum(PromotionAnalytics.views).label('total_views'),
            func.sum(PromotionAnalytics.clicks).label('total_clicks')
        ).group_by(PromotionAnalytics.promotion_id).all()

        return jsonify({
            'success': True,
            'analytics': [{
                'promotion_id': a.promotion_id,
                'total_views': a.total_views or 0,
                'total_clicks': a.total_clicks or 0
            } for a in total_analytics]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
