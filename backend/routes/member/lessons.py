"""Member lesson API — provides lesson detail for the student-facing player page."""
from flask import Blueprint, jsonify
from db.database import db
from models import Course, Module, Document, FAQ, student_lessons
from .auth_helpers import member_or_preview
from cache import cache_get, cache_set

member_lessons_bp = Blueprint('member_lessons', __name__)


# ── Cache builder ─────────────────────────────────────────────────

def _build_module_content(course_id, module_id):
    """Build static module content for caching — no per-student completion flags."""
    module = Module.query.filter_by(id=module_id, course_id=course_id).first()
    if not module:
        return None
    course = module.course
    lessons = []
    for lesson in module.lessons:
        # Only expose published lessons to students
        if (lesson.status or 'published') != 'published':
            continue
        documents = [{
            'id': doc.id,
            'filename': doc.filename,
        } for doc in Document.query.filter_by(lesson_id=lesson.id).all()]
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
            'thumbnailUrl': lesson.thumbnail_url,
            'order': lesson.order,
            'hasButton': lesson.has_button,
            'buttonText': lesson.button_text,
            'buttonLink': lesson.button_link,
            'buttonDelay': lesson.button_delay,
            'documents': documents,
            'faqs': faqs,
        })
    return {
        'courseId': course.id,
        'courseName': course.name,
        'courseLegacyMenuItems': course.menu_items or [],
        'module': {
            'id': module.id,
            'name': module.name,
            'order': module.order,
        },
        'lessons': lessons,
        'totalLessons': len(lessons),
    }


# ── Route ─────────────────────────────────────────────────────────

@member_lessons_bp.route('/courses/<int:course_id>/modules/<int:module_id>', methods=['GET'])
@member_or_preview
def get_module_lessons(student, course_id, module_id):
    """Returns all lessons in a module with completion status and metadata."""
    course = Course.query.get_or_404(course_id)

    if student is not None and course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    # Validate module belongs to course (404 if not)
    Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()

    # Load static content from cache
    cache_key = f'module:{module_id}:content'
    content = cache_get(cache_key)
    if content is None:
        content = _build_module_content(course_id, module_id)
        if content:
            cache_set(cache_key, content)

    if not content:
        return jsonify({'error': 'Módulo não encontrado'}), 404

    # Completion status (always live)
    lesson_ids = [l['id'] for l in content['lessons']]
    if student is not None and lesson_ids:
        completed_ids = {
            row[0] for row in db.session.execute(
                db.select(student_lessons.c.lesson_id).where(
                    student_lessons.c.student_id == student.id,
                    student_lessons.c.lesson_id.in_(lesson_ids),
                )
            )
        }
    else:
        completed_ids = set()

    lessons = [{**l, 'completed': l['id'] in completed_ids} for l in content['lessons']]
    completed_count = sum(1 for l in lessons if l['completed'])

    if student is not None:
        from models import StudentActivityLog
        mod_title = content['module'].get('title') if isinstance(content.get('module'), dict) else None
        StudentActivityLog.log(
            student_id=student.id,
            action='view_module',
            description=f"Acessou o módulo '{mod_title or 'Módulo'}'",
            module_name=mod_title,
            item_name=content.get('courseName'),
            details={'course_id': course_id, 'module_id': module_id},
            debounce_seconds=180
        )

    return jsonify({
        'course': {
            'id': content['courseId'],
            'name': content['courseName'],
            'menuItems': content['courseLegacyMenuItems'],
        },
        'module': content['module'],
        'lessons': lessons,
        'totalLessons': content['totalLessons'],
        'completedLessons': completed_count,
    })


@member_lessons_bp.route('/lessons/<int:lesson_id>/view', methods=['POST'])
@member_or_preview
def record_lesson_view(student, lesson_id):
    """Registra que o aluno abriu/está assistindo a uma aula específica."""
    if student is None:
        return jsonify({'success': True, 'message': 'Preview mode'}), 200

    from models import Lesson, StudentActivityLog
    lesson = Lesson.query.get_or_404(lesson_id)
    module_title = lesson.module.title if lesson.module else None

    StudentActivityLog.log(
        student_id=student.id,
        action='view_lesson',
        description=f"Assistiu à aula '{lesson.title}'",
        module_name=module_title,
        item_name=lesson.title,
        details={
            'lesson_id': lesson.id,
            'module_id': lesson.module_id,
            'course_id': lesson.module.course_id if lesson.module else None
        },
        debounce_seconds=120
    )

    return jsonify({'success': True, 'message': 'Visualização registrada'}), 200
