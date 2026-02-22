from flask import Blueprint, jsonify, session
from functools import wraps
from models import Student, Showcase, ShowcaseAnalytics
from db.database import db
from datetime import date

member_showcase_bp = Blueprint('member_showcase', __name__)


def student_required(f):
    """Ensures the user is a logged-in student."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'student':
            return jsonify({'error': 'Não autorizado'}), 401
        student = Student.query.get(session['user_id'])
        if not student:
            return jsonify({'error': 'Aluno não encontrado'}), 401
        return f(student, *args, **kwargs)
    return decorated


@member_showcase_bp.route('/showcase', methods=['GET'])
@student_required
def get_member_showcases(student):
    """Returns active showcases relevant to the student's courses."""
    student_course_ids = set(c.id for c in student.courses)

    showcases = Showcase.query.filter(
        Showcase.status == 'active'
    ).order_by(Showcase.priority.desc()).all()

    result = []
    for item in showcases:
        # Filter: showcase must have at least one course the student has access to
        showcase_course_ids = [c.id for c in item.courses]
        if not showcase_course_ids or any(cid in student_course_ids for cid in showcase_course_ids):
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
@student_required
def track_showcase_view(student, showcase_id):
    """Track a view for a showcase item."""
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
@student_required
def track_showcase_click(student, showcase_id):
    """Track a click/conversion for a showcase item."""
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
