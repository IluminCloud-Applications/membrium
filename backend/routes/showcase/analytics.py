from flask import Blueprint, jsonify, session
from functools import wraps
from datetime import datetime
from sqlalchemy import func
from db.database import db
from models import Admin, Showcase, ShowcaseAnalytics, showcase_courses, Course
from pytz import timezone

analytics_bp = Blueprint('showcase_analytics', __name__)

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


@analytics_bp.route('/<int:showcase_id>/analytics/view', methods=['POST'])
def track_view(showcase_id):
    """Increment view count for a showcase item (public endpoint)."""
    try:
        today = datetime.now(SP_TZ).date()
        record = ShowcaseAnalytics.query.filter_by(
            showcase_id=showcase_id, date=today
        ).first()

        if record:
            record.views += 1
        else:
            record = ShowcaseAnalytics(
                showcase_id=showcase_id, date=today, views=1, conversions=0
            )
            db.session.add(record)

        db.session.commit()
        return jsonify({'success': True, 'views': record.views})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/<int:showcase_id>/analytics/click', methods=['POST'])
def track_click(showcase_id):
    """Increment click/conversion count for a showcase item (public endpoint)."""
    try:
        today = datetime.now(SP_TZ).date()
        record = ShowcaseAnalytics.query.filter_by(
            showcase_id=showcase_id, date=today
        ).first()

        if record:
            record.conversions += 1
        else:
            record = ShowcaseAnalytics(
                showcase_id=showcase_id, date=today, views=0, conversions=1
            )
            db.session.add(record)

        db.session.commit()
        return jsonify({'success': True, 'conversions': record.conversions})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/analytics/today', methods=['GET'])
@admin_required
def get_today_analytics():
    """Get analytics for all showcase items for today."""
    try:
        today = datetime.now(SP_TZ).date()
        analytics = ShowcaseAnalytics.query.filter_by(date=today).all()

        return jsonify({
            'success': True,
            'analytics': [{
                'showcase_id': a.showcase_id,
                'views': a.views,
                'conversions': a.conversions,
                'date': a.date.isoformat()
            } for a in analytics]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/analytics/total', methods=['GET'])
@admin_required
def get_total_analytics():
    """Get total analytics for all showcase items (all time)."""
    try:
        total_analytics = db.session.query(
            ShowcaseAnalytics.showcase_id,
            func.sum(ShowcaseAnalytics.views).label('total_views'),
            func.sum(ShowcaseAnalytics.conversions).label('total_conversions')
        ).group_by(ShowcaseAnalytics.showcase_id).all()

        return jsonify({
            'success': True,
            'analytics': [{
                'showcase_id': a.showcase_id,
                'total_views': a.total_views or 0,
                'total_conversions': a.total_conversions or 0
            } for a in total_analytics]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@analytics_bp.route('/active', methods=['GET'])
def get_active_showcase():
    """Get active showcase items for students (public endpoint)."""
    try:
        active_items = Showcase.query.filter_by(status='active').order_by(
            Showcase.priority.desc()
        ).all()

        return jsonify({
            'success': True,
            'items': [{
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'image': item.image,
                'url': item.url,
                'priority': item.priority,
                'courses': [{'id': c.id, 'name': c.name} for c in item.courses],
            } for item in active_items]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
