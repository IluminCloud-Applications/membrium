from flask import Blueprint, jsonify, session, request
from functools import wraps
from db.database import db
from models import Student, Lesson, Module, student_lessons

member_progress_bp = Blueprint('member_progress', __name__)


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
@student_required
def mark_lesson_complete(student, lesson_id):
    """Marks a lesson as completed."""
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson not in student.completed_lessons:
        student.completed_lessons.append(lesson)
        db.session.commit()

    return jsonify({'success': True, 'message': 'Aula concluída!'})


@member_progress_bp.route('/lessons/<int:lesson_id>/uncomplete', methods=['POST'])
@student_required
def unmark_lesson_complete(student, lesson_id):
    """Removes completion mark from a lesson."""
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson in student.completed_lessons:
        student.completed_lessons.remove(lesson)
        db.session.commit()

    return jsonify({'success': True, 'message': 'Marcação removida!'})


@member_progress_bp.route('/search', methods=['GET'])
@student_required
def search_content(student):
    """Search through course modules and lessons."""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify([])

    results = []
    for course in student.courses:
        if not course.is_published:
            continue
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
