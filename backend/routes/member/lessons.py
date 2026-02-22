"""Member lesson API — provides lesson detail for the student-facing player page."""
from flask import Blueprint, jsonify, session
from db.database import db
from models import Student, Course, Module, Lesson, Document, FAQ, student_lessons
from .auth_helpers import member_or_preview

member_lessons_bp = Blueprint('member_lessons', __name__)


@member_lessons_bp.route('/courses/<int:course_id>/modules/<int:module_id>', methods=['GET'])
@member_or_preview
def get_module_lessons(student, course_id, module_id):
    """Returns all lessons in a module with completion status and metadata.
    In admin preview mode (student=None), skips access check."""
    course = Course.query.get_or_404(course_id)

    # Check student has access (skip for admin preview)
    if student is not None and course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()

    # Build lessons list
    lessons = []
    for lesson in module.lessons:
        if student is not None:
            is_completed = db.session.query(student_lessons).filter_by(
                student_id=student.id,
                lesson_id=lesson.id,
            ).first() is not None
        else:
            is_completed = False

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
