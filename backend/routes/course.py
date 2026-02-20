from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort, url_for
from functools import wraps
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Document
from db.utils import format_description, check_installation

course_bp = Blueprint('course', __name__)

def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@course_bp.route('/admin/course/<int:course_id>/details', methods=['GET'])
@admin_required
def get_course_details(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({
        'id': course.id,
        'name': course.name,
        'description': course.description,
        'image': course.image,
        'modules': [{
            'id': module.id,
            'name': module.name,
            'image': module.image,
            'order': module.order,
            'lessons': [{
                'id': lesson.id,
                'title': lesson.title,
                'description': lesson.description,
                'video_url': lesson.video_url,
                'video_type': lesson.video_type,
                'order': lesson.order,
                'has_button': lesson.has_button,
                'button_text': lesson.button_text,
                'button_link': lesson.button_link,
                'button_delay': lesson.button_delay
            } for lesson in module.lessons]
        } for module in course.modules]
    })

@course_bp.route('/admin/course/<int:course_id>/modification')
@admin_required
def course_modification(course_id):
    course = Course.query.get_or_404(course_id)
    return render_template('course_modification.html', course=course)

@course_bp.route('/preview_course/<int:course_id>')
@admin_required
def preview_course(course_id):
    course = Course.query.get_or_404(course_id)
    return render_template('preview_course.html', course=course)

# Rota para a API que fornece detalhes do curso para pré-visualização
@course_bp.route('/api/preview_course/<int:course_id>')
@admin_required
def api_preview_course_details(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({
        'id': course.id,
        'title': course.name,
        'description': course.description,
        'modules': [{
            'id': module.id,
            'title': module.name,
            'image': module.image or '/static/default-module-image.jpg',
            'lessons': [{'id': lesson.id, 'title': lesson.title} for lesson in module.lessons]
        } for module in course.modules]
    })

# Student course routes
@course_bp.route('/course/<int:course_id>')
@student_required
def course_view(course_id):
    return render_template('course_modules.html')

@course_bp.route('/api/course/<int:course_id>')
@student_required
def api_get_course_details(course_id):
    from models import student_lessons
    course = Course.query.get_or_404(course_id)
    student = Student.query.get(session['user_id'])
    
    # Calcular o número total de aulas e aulas concluídas
    total_lessons = sum(len(module.lessons) for module in course.modules)
    completed_lessons = db.session.query(student_lessons).filter_by(student_id=student.id).join(Lesson).join(Module).filter(Module.course_id == course_id).count()
    
    return jsonify({
        'id': course.id,
        'title': course.name,
        'description': course.description,
        'instructor': 'Nome do Instrutor',  # Você precisará adicionar este campo ao modelo Course
        'totalLessons': total_lessons,
        'completedLessons': completed_lessons,
        'modules': [{
            'id': module.id,
            'title': module.name,
            'description': 'Descrição do módulo',  # Você pode adicionar este campo ao modelo Module
            'image': module.image or '/static/default-module-image.jpg',
            'lessons': [{'id': lesson.id, 'title': lesson.title} for lesson in module.lessons]
        } for module in course.modules]
    })

@course_bp.route('/api/course/<int:course_id>/progress')
@student_required
def get_course_progress(course_id):
    from models import student_lessons
    student = Student.query.get(session['user_id'])
    course = Course.query.get_or_404(course_id)
    
    # Get all lessons in this course's modules
    total_lessons = db.session.query(Lesson)\
        .join(Module)\
        .filter(Module.course_id == course_id)\
        .count()
    
    # Get completed lessons for this course
    completed_lessons = db.session.query(student_lessons)\
        .join(Lesson)\
        .join(Module)\
        .filter(Module.course_id == course_id)\
        .filter(student_lessons.c.student_id == student.id)\
        .count()
    
    progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    return jsonify({
        'course_id': course_id,
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'progress_percentage': round(progress_percentage, 1)
    })
