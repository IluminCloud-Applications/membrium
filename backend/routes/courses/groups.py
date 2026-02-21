from flask import Blueprint, jsonify, request, session
from functools import wraps
from db.database import db
from models import Admin, Course, CourseGroup, course_group_courses

groups_bp = Blueprint('courses_groups', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def serialize_group(group):
    """Serialize a CourseGroup to dict."""
    return {
        'id': group.id,
        'name': group.name,
        'principal_course_id': group.principal_course_id,
        'course_ids': [c.id for c in group.courses],
        'created_at': group.created_at.isoformat() if group.created_at else None,
    }


@groups_bp.route('/groups', methods=['GET'])
@admin_required
def get_groups():
    """List all course groups."""
    groups = CourseGroup.query.order_by(CourseGroup.created_at.desc()).all()
    return jsonify([serialize_group(g) for g in groups])


@groups_bp.route('/groups', methods=['POST'])
@admin_required
def create_group():
    """Create a new course group."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Body inválido'}), 400

    name = data.get('name', '').strip()
    principal_course_id = data.get('principal_course_id')
    course_ids = data.get('course_ids', [])

    if not name:
        return jsonify({'success': False, 'message': 'Nome é obrigatório'}), 400
    if not course_ids or len(course_ids) < 2:
        return jsonify({'success': False, 'message': 'Selecione pelo menos 2 cursos'}), 400

    # Validate courses exist
    courses = Course.query.filter(Course.id.in_(course_ids)).all()
    if len(courses) != len(course_ids):
        return jsonify({'success': False, 'message': 'Cursos inválidos'}), 400

    group = CourseGroup(
        name=name,
        principal_course_id=principal_course_id,
    )
    group.courses = courses
    db.session.add(group)
    db.session.commit()

    return jsonify({'success': True, 'group': serialize_group(group)})


@groups_bp.route('/groups/<int:group_id>', methods=['PUT'])
@admin_required
def update_group(group_id):
    """Update a course group."""
    try:
        group = CourseGroup.query.get_or_404(group_id)
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Body inválido'}), 400

        name = data.get('name', group.name).strip()
        principal_course_id = data.get('principal_course_id', group.principal_course_id)
        course_ids = data.get('course_ids')

        group.name = name
        group.principal_course_id = principal_course_id

        if course_ids is not None:
            courses = Course.query.filter(Course.id.in_(course_ids)).all()
            group.courses = courses

        db.session.commit()
        return jsonify({'success': True, 'group': serialize_group(group)})

    except Exception as e:
        print(f"Erro ao atualizar grupo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao atualizar grupo'}), 500


@groups_bp.route('/groups/<int:group_id>', methods=['DELETE'])
@admin_required
def delete_group(group_id):
    """Delete a course group (does not delete the courses)."""
    try:
        group = CourseGroup.query.get_or_404(group_id)
        db.session.delete(group)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Grupo excluído com sucesso'})
    except Exception as e:
        print(f"Erro ao deletar grupo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar grupo'}), 500
