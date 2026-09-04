"""CRUD de Combos de Cursos (API REST)."""
from functools import wraps
from flask import Blueprint, jsonify, request, session
from db.database import db
from models import Admin, Course, CourseCombo
import logging

logger = logging.getLogger(__name__)

combos_bp = Blueprint('combos', __name__, url_prefix='/api/combos')


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@combos_bp.route('', methods=['GET'])
@admin_required
def list_combos():
    """Retorna todos os combos cadastrados com seus cursos inclusos."""
    combos = CourseCombo.query.order_by(CourseCombo.created_at.desc()).all()
    return jsonify({
        'success': True,
        'combos': [combo.to_dict() for combo in combos]
    }), 200


@combos_bp.route('', methods=['POST'])
@admin_required
def create_combo():
    """Cria um novo combo de cursos."""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip() or None
    course_ids = data.get('course_ids', [])

    if not name:
        return jsonify({'success': False, 'message': 'Nome do combo é obrigatório'}), 400

    if not course_ids or not isinstance(course_ids, list):
        return jsonify({'success': False, 'message': 'Selecione ao menos um curso para o combo'}), 400

    courses = Course.query.filter(Course.id.in_(course_ids)).all()
    if not courses:
        return jsonify({'success': False, 'message': 'Nenhum curso válido encontrado'}), 400

    combo = CourseCombo(
        name=name,
        description=description,
        courses=courses,
    )

    try:
        db.session.add(combo)
        db.session.commit()
        logger.info(f"Combo criado: {combo.name} (UUID: {combo.uuid}, {len(courses)} cursos)")
        return jsonify({
            'success': True,
            'message': 'Combo criado com sucesso',
            'combo': combo.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar combo: {e}")
        return jsonify({'success': False, 'message': 'Erro interno ao salvar combo'}), 500


@combos_bp.route('/<int:combo_id>', methods=['GET'])
@admin_required
def get_combo(combo_id):
    """Retorna detalhes de um combo específico."""
    combo = CourseCombo.query.get(combo_id)
    if not combo:
        return jsonify({'success': False, 'message': 'Combo não encontrado'}), 404

    return jsonify({
        'success': True,
        'combo': combo.to_dict()
    }), 200


@combos_bp.route('/<int:combo_id>', methods=['PUT'])
@admin_required
def update_combo(combo_id):
    """Atualiza dados e cursos de um combo."""
    combo = CourseCombo.query.get(combo_id)
    if not combo:
        return jsonify({'success': False, 'message': 'Combo não encontrado'}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip() or None
    course_ids = data.get('course_ids')

    if not name:
        return jsonify({'success': False, 'message': 'Nome do combo é obrigatório'}), 400

    combo.name = name
    combo.description = description

    if course_ids is not None:
        if not isinstance(course_ids, list) or not course_ids:
            return jsonify({'success': False, 'message': 'Selecione ao menos um curso para o combo'}), 400
        courses = Course.query.filter(Course.id.in_(course_ids)).all()
        combo.courses = courses

    try:
        db.session.commit()
        logger.info(f"Combo atualizado: {combo.name} ({len(combo.courses)} cursos)")
        return jsonify({
            'success': True,
            'message': 'Combo atualizado com sucesso',
            'combo': combo.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar combo: {e}")
        return jsonify({'success': False, 'message': 'Erro interno ao atualizar combo'}), 500


@combos_bp.route('/<int:combo_id>', methods=['DELETE'])
@admin_required
def delete_combo(combo_id):
    """Remove um combo sem remover os cursos."""
    combo = CourseCombo.query.get(combo_id)
    if not combo:
        return jsonify({'success': False, 'message': 'Combo não encontrado'}), 404

    name = combo.name
    try:
        db.session.delete(combo)
        db.session.commit()
        logger.info(f"Combo excluído: {name}")
        return jsonify({
            'success': True,
            'message': f'Combo "{name}" excluído com sucesso'
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir combo: {e}")
        return jsonify({'success': False, 'message': 'Erro interno ao excluir combo'}), 500
