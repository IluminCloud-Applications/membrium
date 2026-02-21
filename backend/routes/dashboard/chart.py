from flask import Blueprint, jsonify, session
from functools import wraps
from sqlalchemy import func
from db.database import db
from models import Admin, Course, Student, student_courses

chart_bp = Blueprint('dashboard_chart', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@chart_bp.route('/course-students', methods=['GET'])
@admin_required
def get_course_students():
    """Return student count per course (for the bar/area chart)."""
    stats = db.session.query(
        Course.id,
        Course.name.label('course_name'),
        func.count(student_courses.c.student_id).label('student_count')
    ).outerjoin(
        student_courses, Course.id == student_courses.c.course_id
    ).group_by(
        Course.id, Course.name
    ).all()

    courses = [
        {
            'id': s.id,
            'name': s.course_name,
            'student_count': s.student_count
        }
        for s in stats
    ]

    return jsonify({
        'courses': courses,
        'total_courses': len(courses),
    })
