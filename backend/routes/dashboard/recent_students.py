from flask import Blueprint, jsonify, session, request
from functools import wraps
from db.database import db
from models import Admin, Student, student_courses, Course

recent_students_bp = Blueprint('dashboard_recent_students', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@recent_students_bp.route('/recent-students', methods=['GET'])
@admin_required
def get_recent_students():
    """Return the 5 most recently registered students."""
    limit = request.args.get('limit', 5, type=int)

    students = Student.query.order_by(Student.id.desc()).limit(limit).all()

    result = []
    for student in students:
        course_names = [c.name for c in student.courses]
        result.append({
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'course_name': course_names[0] if course_names else None,
            'courses': course_names,
        })

    return jsonify({'students': result})
