"""Member lesson API — provides lesson detail for the student-facing player page."""
from flask import Blueprint, jsonify, session
from functools import wraps
from db.database import db
from models import Student, Course, Module, Lesson, Document, FAQ, student_lessons

member_lessons_bp = Blueprint('member_lessons', __name__)


def student_required(f):
    """Ensures the user is a logged-in student."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'student':
            return jsonify({'error': 'Não autorizado'}), 401
        student = Student.query.get(session['user_id'])
        if not student:
            return jsonify({'error': 'Aluno não encontrado'}), 401
        return f(student, *args, **kwargs)
    return decorated


@member_lessons_bp.route('/courses/<int:course_id>/modules/<int:module_id>', methods=['GET'])
@student_required
def get_module_lessons(student, course_id, module_id):
    """Returns all lessons in a module with completion status and metadata."""
    course = Course.query.get_or_404(course_id)

    # Check student has access
    if course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()

    # Build lessons list
    lessons = []
    for lesson in module.lessons:
        is_completed = db.session.query(student_lessons).filter_by(
            student_id=student.id,
            lesson_id=lesson.id,
        ).first() is not None

        # Get documents for this lesson
        documents = [{
            'id': doc.id,
            'filename': doc.filename,
        } for doc in Document.query.filter_by(lesson_id=lesson.id).all()]

        # Get FAQ for this lesson
        faqs = [{
            'id': faq.id,
            'question': faq.question,
            'answer': faq.answer,
            'order': faq.order,
        } for faq in FAQ.query.filter_by(lesson_id=lesson.id).order_by(FAQ.order).all()]

        lessons.append({
            'id': lesson.id,
            'title': lesson.title,
            'description': lesson.description,
            'videoUrl': lesson.video_url,
            'videoType': lesson.video_type,
            'order': lesson.order,
            'hasButton': lesson.has_button,
            'buttonText': lesson.button_text,
            'buttonLink': lesson.button_link,
            'buttonDelay': lesson.button_delay,
            'completed': is_completed,
            'documents': documents,
            'faqs': faqs,
        })

    # Calculate total progress for the module
    total_lessons = len(module.lessons)
    completed_count = sum(1 for l in lessons if l['completed'])

    return jsonify({
        'course': {
            'id': course.id,
            'name': course.name,
            'menuItems': course.menu_items or [],
        },
        'module': {
            'id': module.id,
            'name': module.name,
            'order': module.order,
        },
        'lessons': lessons,
        'totalLessons': total_lessons,
        'completedLessons': completed_count,
    })
