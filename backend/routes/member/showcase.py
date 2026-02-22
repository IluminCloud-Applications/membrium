from flask import Blueprint, jsonify, session
from models import Student, Showcase, ShowcaseAnalytics
from db.database import db
from datetime import date
from .auth_helpers import member_or_preview

member_showcase_bp = Blueprint('member_showcase', __name__)


@member_showcase_bp.route('/showcase', methods=['GET'])
@member_or_preview
def get_member_showcases(student):
    """Returns active showcases relevant to the student's courses.
    In admin preview mode (student=None), returns all active showcases."""
    if student is not None:
        student_course_ids = set(c.id for c in student.courses)
    else:
        student_course_ids = None  # show all

    showcases = Showcase.query.filter(
        Showcase.status == 'active'
    ).order_by(Showcase.priority.desc()).all()

    result = []
    for item in showcases:
        showcase_course_ids = [c.id for c in item.courses]
        # Admin preview: show all; Student: filter by access
        if student_course_ids is not None:
            if showcase_course_ids and not any(cid in student_course_ids for cid in showcase_course_ids):
                continue

        result.append({
            'id': item.id,
            'title': item.name,
            'description': item.description or '',
            'imageUrl': f'/static/uploads/{item.image}' if item.image else '',
            'url': item.url,
            'courses': [{'id': c.id, 'name': c.name} for c in item.courses],
        })

    return jsonify(result)


@member_showcase_bp.route('/showcase/<int:showcase_id>/view', methods=['POST'])
@member_or_preview
def track_showcase_view(student, showcase_id):
    """Track a view for a showcase item. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = ShowcaseAnalytics.query.filter_by(
        showcase_id=showcase_id, date=today
    ).first()

    if analytics:
        analytics.views += 1
    else:
        analytics = ShowcaseAnalytics(
            showcase_id=showcase_id, date=today, views=1, conversions=0
        )
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})


@member_showcase_bp.route('/showcase/<int:showcase_id>/click', methods=['POST'])
@member_or_preview
def track_showcase_click(student, showcase_id):
    """Track a click/conversion for a showcase item. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = ShowcaseAnalytics.query.filter_by(
        showcase_id=showcase_id, date=today
    ).first()

    if analytics:
        analytics.conversions += 1
    else:
        analytics = ShowcaseAnalytics(
            showcase_id=showcase_id, date=today, views=0, conversions=1
        )
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})
