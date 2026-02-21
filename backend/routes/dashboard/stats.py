from flask import Blueprint, jsonify, session, redirect, url_for
from functools import wraps
from sqlalchemy import func
from db.database import db
from models import Admin, Course, Student, Lesson, student_courses

stats_bp = Blueprint('dashboard_stats', __name__)


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
def get_dashboard_stats():
    """Return aggregated dashboard metrics."""
    total_courses = Course.query.count()
    total_students = Student.query.count()
    total_lessons = Lesson.query.count()

    # Active students = students enrolled in at least 1 course
    active_students = db.session.query(
        func.count(func.distinct(student_courses.c.student_id))
    ).scalar() or 0

    return jsonify({
        'total_courses': total_courses,
        'total_students': total_students,
        'total_lessons': total_lessons,
        'active_students': active_students,
    })
