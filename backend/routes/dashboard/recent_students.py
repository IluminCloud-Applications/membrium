from flask import Blueprint, jsonify, session, request
from auth_decorators import admin_required
from functools import wraps
from db.database import db
from models import Admin, Student, student_courses, Course

recent_students_bp = Blueprint('dashboard_recent_students', __name__)


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
            'created_at': (student.created_at.isoformat() + 'Z') if student.created_at else None,
        })

    return jsonify({'students': result})
