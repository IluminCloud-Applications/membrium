from flask import Blueprint, request, redirect, url_for, jsonify, session
from functools import wraps
from sqlalchemy import or_
from db.database import db
from models import Admin, Student, Lesson, student_courses

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.before_request
def check_admin_routes():
    if 'user_type' not in session or session['user_type'] != 'admin':
        return redirect(url_for('auth.login'))


@admin_bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    search = request.args.get('search', '')
    course_filter = request.args.get('course', '')

    query = Student.query

    if search:
        query = query.filter(or_(
            Student.name.ilike(f'%{search}%'),
            Student.email.ilike(f'%{search}%')
        ))

    if course_filter:
        try:
            course_id = int(course_filter)
            query = query.join(student_courses).filter(student_courses.c.course_id == course_id)
        except (ValueError, TypeError):
            pass

    students = query.order_by(Student.name).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'students': [{
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'phone': student.phone,
            'uuid': student.uuid,
            'courses': [{'id': course.id, 'name': course.name} for course in student.courses]
        } for student in students.items],
        'pages': students.pages,
        'current_page': page
    })


@admin_bp.route('/total-students', methods=['GET'])
@admin_required
def get_total_students():
    total = Student.query.count()
    return jsonify({'total': total})


@admin_bp.route('/total-lessons', methods=['GET'])
@admin_required
def get_total_lessons():
    total = Lesson.query.count()
    return jsonify({'total': total})
