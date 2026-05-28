from flask import Blueprint, jsonify
from models import Student, Course, Module
from .auth_helpers import member_or_preview
from db.integration_helpers import get_integration
from db.database import db
from cache import cache_get, cache_set

member_courses_bp = Blueprint('member_courses', __name__)


# ── Cache builders ────────────────────────────────────────────────

def _build_courses_structure():
    """Build static course list for caching — no per-student fields."""
    courses = Course.query.filter_by(is_published=True).order_by(Course.id).all()
    result = []
    for course in courses:
        modules = course.modules
        if not modules:
            continue
        result.append({
            'id': course.id,
            'uuid': course.uuid,
            'name': course.name,
            'description': course.description,
            'image': course.image,
            'category': course.category,
            'moduleFormat': course.module_format,
            'coverDesktop': course.cover_desktop,
            'coverMobile': course.cover_mobile,
            'checkoutUrl': course.checkout_url,
            'modules': [{
                'id': m.id,
                'name': m.name,
                'image': m.image,
                'order': m.order,
                'unlockAfterDays': m.unlock_after_days or 0,
                'lessonIds': [l.id for l in m.lessons if (l.status or 'published') == 'published'],
            } for m in modules],
        })
    return result


def _build_course_detail_structure(course_id):
    """Build static single-course structure for caching — no completion flags."""
    course = Course.query.get(course_id)
    if not course:
        return None
    modules = []
    for m in course.modules:
        lessons = [{
            'id': l.id,
            'title': l.title,
            'description': l.description,
            'videoUrl': l.video_url,
            'videoType': l.video_type,
            'thumbnailUrl': l.thumbnail_url,
            'order': l.order,
            'hasButton': l.has_button,
            'buttonText': l.button_text,
            'buttonLink': l.button_link,
            'buttonDelay': l.button_delay,
        } for l in m.lessons if (l.status or 'published') == 'published']
        modules.append({
            'id': m.id,
            'name': m.name,
            'image': m.image,
            'order': m.order,
            'lessons': lessons,
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
        'checkoutUrl': course.checkout_url,
        'modules': modules,
    }


# ── Helpers ───────────────────────────────────────────────────────

def _get_completed_ids(student, lesson_ids):
    """Return set of completed lesson IDs for a student from a given list."""
    if not student or not lesson_ids:
        return set()
    from models import student_lessons as sl_table
    rows = db.session.execute(
        db.select(sl_table.c.lesson_id).where(
            sl_table.c.student_id == student.id,
            sl_table.c.lesson_id.in_(lesson_ids),
        )
    )
    return {row[0] for row in rows}


# ── Routes ────────────────────────────────────────────────────────

@member_courses_bp.route('/courses', methods=['GET'])
@member_or_preview
def get_student_courses(student):
    from sqlalchemy import text

    # 1. Load static structure from cache
    courses_structure = cache_get('courses:published')
    if courses_structure is None:
        courses_structure = _build_courses_structure()
        cache_set('courses:published', courses_structure)

    # 2. Auto-provision bonus courses for real students
    if student is not None:
        bonus_ids = [c['id'] for c in courses_structure if c['category'] == 'bonus']
        if bonus_ids:
            for cid in bonus_ids:
                db.session.execute(
                    text("INSERT INTO student_courses (student_id, course_id) "
                         "VALUES (:sid, :cid) ON CONFLICT DO NOTHING"),
                    {"sid": student.id, "cid": cid},
                )
            db.session.commit()
            db.session.refresh(student)

    # 3. One query for all completed lesson IDs
    all_lesson_ids = [lid for c in courses_structure for m in c['modules'] for lid in m['lessonIds']]
    completed_ids = _get_completed_ids(student, all_lesson_ids)
    student_course_ids = {c.id for c in student.courses} if student is not None else None

    # 4. Global menu (live — lightweight integration table read)
    _, menu_config = get_integration('menu')
    global_menu = menu_config.get('items', [])

    from datetime import datetime
    now = datetime.utcnow()

    result = []
    for c in courses_structure:
        if student is None:
            # Admin preview: all unlocked, no progress
            modules = [{
                'id': m['id'], 'name': m['name'], 'image': m['image'],
                'order': m['order'], 'totalLessons': len(m['lessonIds']),
                'completedLessons': 0, 'unlockAfterDays': m['unlockAfterDays'],
                'isLocked': False, 'unlockDaysRemaining': 0,
            } for m in c['modules']]
            result.append({
                **{k: c[k] for k in ('id','uuid','name','description','image','category','moduleFormat','coverDesktop','coverMobile','checkoutUrl')},
                'menuItems': global_menu,
                'modules': modules,
                'hasAccess': True,
            })
            continue

        has_access = c['id'] in student_course_ids
        if not has_access:
            modules = [{
                'id': m['id'], 'name': m['name'], 'image': m['image'],
                'order': m['order'], 'totalLessons': len(m['lessonIds']),
                'completedLessons': 0, 'unlockAfterDays': 0,
                'isLocked': True, 'unlockDaysRemaining': 0,
            } for m in c['modules']]
            result.append({
                **{k: c[k] for k in ('id','uuid','name','description','image','category','moduleFormat','coverDesktop','coverMobile','checkoutUrl')},
                'menuItems': [],
                'modules': modules,
                'hasAccess': False,
            })
            continue

        modules = []
        for m in c['modules']:
            total = len(m['lessonIds'])
            done = sum(1 for lid in m['lessonIds'] if lid in completed_ids)
            is_locked = False
            unlock_remaining = 0
            if m['unlockAfterDays'] > 0:
                days = (now - student.created_at).days
                if days < m['unlockAfterDays']:
                    is_locked = True
                    unlock_remaining = m['unlockAfterDays'] - days
            modules.append({
                'id': m['id'], 'name': m['name'], 'image': m['image'],
                'order': m['order'], 'totalLessons': total,
                'completedLessons': done, 'unlockAfterDays': m['unlockAfterDays'],
                'isLocked': is_locked, 'unlockDaysRemaining': unlock_remaining,
            })
        result.append({
            **{k: c[k] for k in ('id','uuid','name','description','image','category','moduleFormat','coverDesktop','coverMobile','checkoutUrl')},
            'menuItems': global_menu,
            'modules': modules,
            'hasAccess': True,
        })

    # Priority mapping for sorting: principal (0), upsell (1), order_bump (2), bonus (3)
    category_priority = {
        'principal': 0,
        'upsell': 1,
        'order_bump': 2,
        'bonus': 3
    }
    result.sort(key=lambda x: (
        0 if x['hasAccess'] else 1,
        category_priority.get(x['category'], 4)
    ))

    return jsonify(result)


@member_courses_bp.route('/courses/<int:course_id>', methods=['GET'])
@member_or_preview
def get_course_detail(student, course_id):
    course_check = Course.query.get_or_404(course_id)

    if student is not None and course_check not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403

    # Load static structure from cache
    cache_key = f'course:{course_id}:detail'
    structure = cache_get(cache_key)
    if structure is None:
        structure = _build_course_detail_structure(course_id)
        if structure:
            cache_set(cache_key, structure)

    if not structure:
        return jsonify({'error': 'Curso não encontrado'}), 404

    # Completed lesson IDs for this course (live)
    all_lesson_ids = [l['id'] for m in structure['modules'] for l in m['lessons']]
    completed_ids = _get_completed_ids(student, all_lesson_ids)

    # Global menu (live)
    _, menu_config = get_integration('menu')
    global_menu = menu_config.get('items', [])

    modules = []
    for m in structure['modules']:
        lessons = [{**l, 'completed': l['id'] in completed_ids} for l in m['lessons']]
        modules.append({**m, 'lessons': lessons})

    return jsonify({
        **{k: structure[k] for k in ('id','uuid','name','description','image','category','moduleFormat','coverDesktop','coverMobile','checkoutUrl')},
        'menuItems': global_menu,
        'modules': modules,
    })
