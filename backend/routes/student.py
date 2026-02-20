from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from werkzeug.security import generate_password_hash
from db.database import db
from models import Course, Admin, Student, Module, Lesson, student_lessons, student_courses
from db.utils import check_installation

student_bp = Blueprint('student', __name__)

def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function

def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@student_bp.route('/dashboard')
@student_required
def dashboard():
    student = Student.query.get(session['user_id'])
    admin = Admin.query.first()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({
            'platform_name': admin.platform_name,
            'student_name': student.name
        })
    return render_template('dashboard.html', student_name=student.name)

@student_bp.route('/dashboard/student-courses')
@student_required
def student_courses():
    student = Student.query.get(session['user_id'])
    return jsonify([{
        'id': course.id,
        'name': course.name,
        'image': course.image
    } for course in student.courses])

@student_bp.route('/dashboard/student-progress')
@student_required
def get_student_progress():
    student_id = session['user_id']
    student = Student.query.get(student_id)

    # Get all courses the student is enrolled in
    student_course_ids = [course.id for course in student.courses]
    
    # Get all modules for these courses
    modules = Module.query.filter(Module.course_id.in_(student_course_ids)).all()
    module_ids = [module.id for module in modules]
    
    # Get total lessons count
    total_lessons = Lesson.query.filter(Lesson.module_id.in_(module_ids)).count()
    
    # Get completed lessons count
    completed_lessons = db.session.query(student_lessons).filter_by(student_id=student_id).join(Lesson).join(Module).filter(Module.course_id.in_(student_course_ids)).count()
    
    # Calculate progress percentage
    progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    return jsonify({
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'progress_percentage': round(progress_percentage, 1)
    })

@student_bp.route('/my_profile')
@student_required
def my_profile():
    # Get the student data
    student = Student.query.get(session['user_id'])
    admin = Admin.query.first()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({
            'platform_name': admin.platform_name,
            'student_name': student.name,
            'student_email': student.email,
            'student_phone': student.phone or ''
        })
    
    return render_template('my_profile.html')

@student_bp.route('/update_password', methods=['POST'])
@student_required
def update_password():
    data = request.json
    new_password = data.get('new_password')
    
    if not new_password:
        return jsonify({'success': False, 'message': 'Nova senha não fornecida'}), 400
    
    student = Student.query.get(session['user_id'])
    student.set_password(new_password)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Senha atualizada com sucesso!'})

@student_bp.route('/mark_lesson_completed', methods=['POST'])
@student_required
def mark_lesson_completed():
    lesson_id = request.json.get('lesson_id')
    
    if not lesson_id:
        return jsonify({'success': False, 'message': 'ID da lição não fornecido'}), 400
    
    student = Student.query.get(session['user_id'])
    lesson = Lesson.query.get(lesson_id)
    
    if not lesson:
        return jsonify({'success': False, 'message': 'Lição não encontrada'}), 404
    
    # Verificar se a lição já foi marcada como concluída
    if lesson not in student.completed_lessons:
        student.completed_lessons.append(lesson)
        db.session.commit()
    
    return jsonify({'success': True, 'message': 'Lição marcada como concluída!'})
