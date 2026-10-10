from flask import Blueprint, jsonify, session
from auth_decorators import admin_required
from functools import wraps
from db.database import db
from models import Admin, FAQ

stats_bp = Blueprint('faq_stats', __name__)


@stats_bp.route('/stats', methods=['GET'])
@admin_required
def get_faq_stats():
    """Get FAQ statistics."""
    try:
        total_faqs = FAQ.query.count()
        lessons_with_faqs = (
            db.session.query(FAQ.lesson_id)
            .distinct()
            .count()
        )
        avg = round(total_faqs / lessons_with_faqs) if lessons_with_faqs > 0 else 0

        return jsonify({
            'totalFaqs': total_faqs,
            'lessonsWithFaq': lessons_with_faqs,
            'averageFaqPerLesson': avg,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
