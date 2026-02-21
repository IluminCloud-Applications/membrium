from flask import Blueprint, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, LessonTranscript
from sqlalchemy import func

stats_bp = Blueprint('transcripts_stats', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@stats_bp.route('/stats', methods=['GET'])
@admin_required
def get_transcript_stats():
    """Get transcript statistics."""
    try:
        total_transcripts = LessonTranscript.query.count()

        courses_with_transcripts = (
            db.session.query(func.count(func.distinct(LessonTranscript.course_id)))
            .scalar()
        )

        # Count unique keywords
        all_keywords = db.session.query(LessonTranscript.searchable_keywords).all()
        unique_keywords = set()
        for (kw_str,) in all_keywords:
            if kw_str:
                for k in kw_str.split(','):
                    stripped = k.strip()
                    if stripped:
                        unique_keywords.add(stripped)

        return jsonify({
            'totalTranscripts': total_transcripts,
            'coursesWithTranscripts': courses_with_transcripts or 0,
            'totalKeywords': len(unique_keywords),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
