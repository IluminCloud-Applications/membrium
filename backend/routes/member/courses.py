from flask import Blueprint, jsonify, session
from functools import wraps
from models import Student

member_courses_bp = Blueprint('member_courses', __name__)


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


@member_courses_bp.route('/courses', methods=['GET'])
@student_required
def get_student_courses(student):
    """Returns all courses the student has access to, with modules and progress."""
    from models import Module, Lesson, CourseGroup, course_group_courses, student_lessons
    from db.database import db
    from datetime import datetime

    now = datetime.utcnow()

    courses_data = []
    for course in student.courses:
        if not course.is_published:
            continue

        modules = []
        for module in course.modules:
            total = len(module.lessons)
            completed = db.session.query(student_lessons).filter_by(
                student_id=student.id
            ).filter(
                student_lessons.c.lesson_id.in_([l.id for l in module.lessons])
            ).count() if module.lessons else 0

            # Calculate lock status
            is_locked = False
            unlock_days_remaining = 0
            if module.unlock_after_days and module.unlock_after_days > 0:
                days_since_enrollment = (now - student.created_at).days
                if days_since_enrollment < module.unlock_after_days:
                    is_locked = True
                    unlock_days_remaining = module.unlock_after_days - days_since_enrollment

            modules.append({
                'id': module.id,
                'name': module.name,
                'image': module.image,
                'order': module.order,
                'totalLessons': total,
                'completedLessons': completed,
                'unlockAfterDays': module.unlock_after_days,
                'isLocked': is_locked,
                'unlockDaysRemaining': unlock_days_remaining,
            })

        courses_data.append({
            'id': course.id,
            'uuid': course.uuid,
            'name': course.name,
            'description': course.description,
            'image': course.image,
            'category': course.category,
            'moduleFormat': course.module_format,
            'theme': course.theme,
            'coverDesktop': course.cover_desktop,
            'coverMobile': course.cover_mobile,
            'menuItems': course.menu_items or [],
            'modules': modules,
        })

    return jsonify(courses_data)


@member_courses_bp.route('/courses/<int:course_id>', methods=['GET'])
@student_required
def get_course_detail(student, course_id):
    """Returns a single course details with modules and lessons."""
    from models import Course, student_lessons
    from db.database import db

    course = Course.query.get_or_404(course_id)

    # Check student has access
    if course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    modules = []
    for module in course.modules:
        lessons = []
        for lesson in module.lessons:
            is_completed = db.session.query(student_lessons).filter_by(
                student_id=student.id,
                lesson_id=lesson.id,
            ).first() is not None

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
            })

        modules.append({
            'id': module.id,
            'name': module.name,
            'image': module.image,
            'order': module.order,
            'lessons': lessons,
        })

    return jsonify({
        'id': course.id,
        'uuid': course.uuid,
        'name': course.name,
        'description': course.description,
        'image': course.image,
        'category': course.category,
        'moduleFormat': course.module_format,
        'theme': course.theme,
        'coverDesktop': course.cover_desktop,
        'coverMobile': course.cover_mobile,
        'menuItems': course.menu_items or [],
        'modules': modules,
    })
