"""Student-facing module routes.
Admin module management is now in routes/course_modification/modules.py.
"""
from flask import Blueprint, redirect, url_for, session, abort, render_template
from functools import wraps
from db.database import db
from models import Course, Student, Module, Lesson, Document, student_lessons
from db.utils import format_description

module_bp = Blueprint('module', __name__)


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


@module_bp.route('/course/<int:course_id>/module/<int:module_id>/lesson/<int:lesson_order>')
@student_required
def module_view(course_id, module_id, lesson_order):
    """Student: view a lesson within a module."""
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
    lessons = Lesson.query.filter_by(module_id=module_id).order_by(Lesson.order).all()

    if lesson_order < 1 or lesson_order > len(lessons):
        return redirect(url_for('module.module_view', course_id=course_id, module_id=module_id, lesson_order=1))

    current_lesson = next((l for l in lessons if l.order == lesson_order), None)
    if not current_lesson:
        abort(404)

    formatted_description = format_description(current_lesson.description)
    document = Document.query.filter_by(lesson_id=current_lesson.id).first()

    student_id = session['user_id']
    lesson_completed = db.session.query(student_lessons).filter_by(
        student_id=student_id, lesson_id=current_lesson.id
    ).first() is not None

    return render_template('module_lessons.html',
                           course=course, module=module, lessons=lessons,
                           current_lesson=current_lesson,
                           formatted_description=formatted_description,
                           document=document, lesson_completed=lesson_completed,
                           has_button=current_lesson.has_button,
                           button_text=current_lesson.button_text,
                           button_link=current_lesson.button_link,
                           button_delay=current_lesson.button_delay)


@module_bp.route('/preview_course/<int:course_id>/module/<int:module_id>/lesson/<int:lesson_order>')
@admin_required
def preview_lessons(course_id, module_id, lesson_order):
    """Admin: preview a lesson."""
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
    lessons = Lesson.query.filter_by(module_id=module_id).order_by(Lesson.order).all()

    if lesson_order < 1 or lesson_order > len(lessons):
        return redirect(url_for('module.preview_lessons', course_id=course_id, module_id=module_id, lesson_order=1))

    current_lesson = next((l for l in lessons if l.order == lesson_order), None)
    if not current_lesson:
        abort(404)

    formatted_description = format_description(current_lesson.description)
    document = Document.query.filter_by(lesson_id=current_lesson.id).first()

    return render_template('preview_lessons.html',
                           course=course, module=module, lessons=lessons,
                           current_lesson=current_lesson,
                           formatted_description=formatted_description,
                           document=document)
