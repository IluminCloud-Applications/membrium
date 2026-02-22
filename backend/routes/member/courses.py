from flask import Blueprint, jsonify, session
from models import Student
from .auth_helpers import member_or_preview

member_courses_bp = Blueprint('member_courses', __name__)


def _build_course_data(course, student):
    """Build course data dict with modules and progress for a student.
    If student is None (admin preview), shows all modules unlocked with no progress.
    """
    from models import student_lessons
    from db.database import db
    from datetime import datetime

    now = datetime.utcnow()
    modules = []

    for module in course.modules:
        total = len(module.lessons)

        # Admin preview: no student context, skip progress/lock
        if student is None:
            completed = 0
            is_locked = False
            unlock_days_remaining = 0
        else:
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

    return {
        'id': course.id,
        'uuid': course.uuid,
        'name': course.name,
        'description': course.description,
        'image': course.image,
        'category': course.category,
        'moduleFormat': course.module_format,
        'coverDesktop': course.cover_desktop,
        'coverMobile': course.cover_mobile,
        'menuItems': course.menu_items or [],
        'modules': modules,
    }


@member_courses_bp.route('/courses', methods=['GET'])
@member_or_preview
def get_student_courses(student):
    """Returns all courses the student has access to, with modules and progress.
    In admin preview mode (student=None), returns ALL published courses."""
    from models import Course

    if student is None:
        # Admin preview: return ALL published courses
        all_courses = Course.query.filter_by(is_published=True).all()
        return jsonify([_build_course_data(c, None) for c in all_courses])

    courses_data = []
    for course in student.courses:
        if not course.is_published:
            continue
        courses_data.append(_build_course_data(course, student))

    return jsonify(courses_data)


@member_courses_bp.route('/courses/grouped', methods=['GET'])
@member_or_preview
def get_student_courses_grouped(student):
    """Returns courses organized by groups for the member area.
    In admin preview mode (student=None), returns ALL published courses.
    """
    from models import CourseGroup, Course, course_group_courses
    from db.database import db

    # Admin preview: all published courses are "accessible"
    if student is None:
        all_published = Course.query.filter_by(is_published=True).all()
        student_course_ids = set(c.id for c in all_published)
    else:
        student_course_ids = set(
            c.id for c in student.courses if c.is_published
        )

    all_groups = CourseGroup.query.all()
    groups_data = []
    grouped_course_ids = set()

    for group in all_groups:
        rows = db.session.query(
            course_group_courses.c.course_id,
            course_group_courses.c.order
        ).filter(
            course_group_courses.c.group_id == group.id
        ).order_by(
            course_group_courses.c.order
        ).all()

        group_course_ids = [r.course_id for r in rows]

        has_any_access = any(cid in student_course_ids for cid in group_course_ids)
        if not has_any_access:
            continue

        group_courses = []
        for cid in group_course_ids:
            course = Course.query.get(cid)
            if not course or not course.is_published:
                continue

            has_access = cid in student_course_ids
            if has_access:
                course_data = _build_course_data(course, student)
            else:
                locked_modules = []
                for module in course.modules:
                    locked_modules.append({
                        'id': module.id,
                        'name': module.name,
                        'image': module.image,
                        'order': module.order,
                        'totalLessons': len(module.lessons),
                        'completedLessons': 0,
                        'unlockAfterDays': 0,
                        'isLocked': True,
                        'unlockDaysRemaining': 0,
                    })
                course_data = {
                    'id': course.id,
                    'uuid': course.uuid,
                    'name': course.name,
                    'description': course.description,
                    'image': course.image,
                    'category': course.category,
                    'moduleFormat': course.module_format,
                    'coverDesktop': course.cover_desktop,
                    'coverMobile': course.cover_mobile,
                    'menuItems': [],
                    'modules': locked_modules,
                }
            course_data['hasAccess'] = has_access
            group_courses.append(course_data)

        grouped_course_ids.update(group_course_ids)

        groups_data.append({
            'id': group.id,
            'name': group.name,
            'principalCourseId': group.principal_course_id,
            'courses': group_courses,
        })

    # Ungrouped
    if student is None:
        all_published = Course.query.filter_by(is_published=True).all()
        ungrouped = [
            _build_course_data(c, None) for c in all_published
            if c.id not in grouped_course_ids
        ]
    else:
        ungrouped = []
        for course in student.courses:
            if not course.is_published:
                continue
            if course.id not in grouped_course_ids:
                ungrouped.append(_build_course_data(course, student))

    return jsonify({
        'groups': groups_data,
        'ungrouped': ungrouped,
    })


@member_courses_bp.route('/courses/<int:course_id>', methods=['GET'])
@member_or_preview
def get_course_detail(student, course_id):
    """Returns a single course details with modules and lessons.
    In admin preview mode (student=None), skips access check."""
    from models import Course, student_lessons
    from db.database import db

    course = Course.query.get_or_404(course_id)

    # Check student has access (skip for admin preview)
    if student is not None and course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    modules = []
    for module in course.modules:
        lessons = []
        for lesson in module.lessons:
            if student is not None:
                is_completed = db.session.query(student_lessons).filter_by(
                    student_id=student.id,
                    lesson_id=lesson.id,
                ).first() is not None
            else:
                is_completed = False

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
        'coverDesktop': course.cover_desktop,
        'coverMobile': course.cover_mobile,
        'menuItems': course.menu_items or [],
        'modules': modules,
    })
