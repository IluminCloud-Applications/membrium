from flask import Blueprint, jsonify, session, request
from db.database import db
from models import Student, Lesson, Module, Course, student_lessons
from .auth_helpers import student_required, member_or_preview

member_progress_bp = Blueprint('member_progress', __name__)


@member_progress_bp.route('/progress', methods=['GET'])
@student_required
def get_progress(student):
    """Returns overall progress across all courses."""
    course_ids = [c.id for c in student.courses]
    modules = Module.query.filter(Module.course_id.in_(course_ids)).all()
    module_ids = [m.id for m in modules]

    total = Lesson.query.filter(Lesson.module_id.in_(module_ids)).count()
    completed = db.session.query(student_lessons).filter_by(
        student_id=student.id
    ).count()

    progress = (completed / total * 100) if total > 0 else 0

    return jsonify({
        'totalLessons': total,
        'completedLessons': completed,
        'progressPercentage': round(progress, 1),
    })


@member_progress_bp.route('/lessons/<int:lesson_id>/complete', methods=['POST'])
@member_or_preview
def mark_lesson_complete(student, lesson_id):
    """Marks a lesson as completed. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True, 'message': 'Preview mode — sem alteração'})

    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson not in student.completed_lessons:
        student.completed_lessons.append(lesson)
        db.session.commit()

    return jsonify({'success': True, 'message': 'Aula concluída!'})


@member_progress_bp.route('/lessons/<int:lesson_id>/uncomplete', methods=['POST'])
@member_or_preview
def unmark_lesson_complete(student, lesson_id):
    """Removes completion mark from a lesson. No-op for admin preview."""
    if student is None:
        return jsonify({'success': True, 'message': 'Preview mode — sem alteração'})

    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson in student.completed_lessons:
        student.completed_lessons.remove(lesson)
        db.session.commit()

    return jsonify({'success': True, 'message': 'Marcação removida!'})


@member_progress_bp.route('/search', methods=['GET'])
@member_or_preview
def search_content(student):
    """Search through course modules and lessons."""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify([])

    # Admin preview: search all published courses
    if student is None:
        courses_list = Course.query.filter_by(is_published=True).all()
    else:
        courses_list = [c for c in student.courses if c.is_published]

    results = []
    for course in courses_list:
        for module in course.modules:
            # Match module name
            if query.lower() in module.name.lower():
                results.append({
                    'type': 'module',
                    'id': module.id,
                    'title': module.name,
                    'courseId': course.id,
                    'courseName': course.name,
                    'image': module.image,
                })
            # Match lessons
            for lesson in module.lessons:
                if query.lower() in lesson.title.lower():
                    results.append({
                        'type': 'lesson',
                        'id': lesson.id,
                        'title': lesson.title,
                        'moduleId': module.id,
                        'moduleName': module.name,
                        'courseId': course.id,
                        'courseName': course.name,
                    })

    return jsonify(results[:20])  # Limit to 20 results
