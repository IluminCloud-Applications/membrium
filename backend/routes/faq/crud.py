from flask import Blueprint, request, jsonify, session
from functools import wraps
from db.database import db
from models import Admin, FAQ, Lesson, Module, Course
from sqlalchemy import func

crud_bp = Blueprint('faq_crud', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def serialize_faq(faq_item):
    """Serialize a single FAQ to dict."""
    return {
        'id': faq_item.id,
        'lesson_id': faq_item.lesson_id,
        'question': faq_item.question,
        'answer': faq_item.answer,
        'order': faq_item.order,
    }


def serialize_lesson_group(lesson, module, course, faqs):
    """Serialize a lesson's FAQ group."""
    return {
        'lessonId': lesson.id,
        'lessonName': lesson.title,
        'moduleId': module.id,
        'moduleName': module.name,
        'courseId': course.id,
        'courseName': course.name,
        'faqs': [serialize_faq(f) for f in faqs],
        'updatedAt': max(
            (f.updated_at for f in faqs if f.updated_at),
            default=None
        ).isoformat() if faqs else None,
    }


@crud_bp.route('/groups', methods=['GET'])
@admin_required
def get_faq_groups():
    """Get all FAQ groups (lessons with FAQs), organized for drill-down."""
    try:
        # Get all lessons that have FAQs
        lesson_ids_with_faqs = (
            db.session.query(FAQ.lesson_id)
            .distinct()
            .all()
        )
        lesson_ids = [lid[0] for lid in lesson_ids_with_faqs]

        if not lesson_ids:
            return jsonify([])

        groups = []
        for lesson_id in lesson_ids:
            lesson = Lesson.query.get(lesson_id)
            if not lesson:
                continue

            module = Module.query.get(lesson.module_id)
            if not module:
                continue

            course = Course.query.get(module.course_id)
            if not course:
                continue

            faqs = FAQ.query.filter_by(lesson_id=lesson_id).order_by(FAQ.order).all()
            groups.append(serialize_lesson_group(lesson, module, course, faqs))

        return jsonify(groups)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/lesson/<int:lesson_id>', methods=['GET'])
@admin_required
def get_lesson_faqs(lesson_id):
    """Get FAQs for a specific lesson."""
    try:
        faqs = FAQ.query.filter_by(lesson_id=lesson_id).order_by(FAQ.order).all()
        return jsonify([serialize_faq(f) for f in faqs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/create', methods=['POST'])
@admin_required
def create_faq():
    """Create FAQs for a lesson."""
    try:
        data = request.get_json()
        lesson_id = data.get('lesson_id')
        faqs_data = data.get('faqs', [])

        if not lesson_id or not faqs_data:
            return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

        # Check if lesson exists
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'message': 'Aula não encontrada'}), 404

        # Check if lesson already has FAQs
        existing = FAQ.query.filter_by(lesson_id=lesson_id).count()
        if existing > 0:
            return jsonify({
                'success': False,
                'message': 'Esta aula já possui FAQs. Edite os existentes.'
            }), 400

        for idx, faq_item in enumerate(faqs_data):
            faq = FAQ(
                lesson_id=lesson_id,
                question=faq_item['question'],
                answer=faq_item['answer'],
                order=idx + 1,
            )
            db.session.add(faq)

        db.session.commit()
        return jsonify({'success': True, 'message': 'FAQs criados com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/update/<int:lesson_id>', methods=['PUT'])
@admin_required
def update_lesson_faqs(lesson_id):
    """Replace all FAQs for a lesson."""
    try:
        data = request.get_json()
        faqs_data = data.get('faqs', [])

        if not faqs_data:
            return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

        # Delete existing FAQs
        FAQ.query.filter_by(lesson_id=lesson_id).delete()

        # Insert updated FAQs
        for idx, faq_item in enumerate(faqs_data):
            faq = FAQ(
                lesson_id=lesson_id,
                question=faq_item['question'],
                answer=faq_item['answer'],
                order=idx + 1,
            )
            db.session.add(faq)

        db.session.commit()
        return jsonify({'success': True, 'message': 'FAQs atualizados com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/lesson/<int:lesson_id>', methods=['DELETE'])
@admin_required
def delete_lesson_faqs(lesson_id):
    """Delete all FAQs for a lesson."""
    try:
        FAQ.query.filter_by(lesson_id=lesson_id).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'FAQs excluídos com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
