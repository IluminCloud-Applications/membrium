from flask import Blueprint, request, jsonify, session
from functools import wraps
from datetime import datetime
from db.database import db
from models import Admin, Showcase, Course, showcase_courses
import os

crud_bp = Blueprint('showcase_crud', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def serialize_showcase(item):
    """Serialize a Showcase item to dict."""
    return {
        'id': item.id,
        'name': item.name,
        'description': item.description,
        'image': item.image,
        'url': item.url,
        'status': item.status,
        'priority': item.priority,
        'courses': [{'id': c.id, 'name': c.name} for c in item.courses],
        'created_at': item.created_at.isoformat() if item.created_at else None,
    }


@crud_bp.route('/items', methods=['GET'])
@admin_required
def get_showcase_items():
    """List all showcase items."""
    try:
        items = Showcase.query.order_by(Showcase.priority.desc()).all()
        return jsonify([serialize_showcase(item) for item in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crud_bp.route('/items', methods=['POST'])
@admin_required
def create_showcase_item():
    """Create a new showcase item."""
    try:
        data = request.get_json()

        name = data.get('name')
        description = data.get('description', '')
        url = data.get('url')
        priority = int(data.get('priority', 5))
        course_ids = data.get('course_ids', [])

        if not name or not url:
            return jsonify({'success': False, 'message': 'Nome e URL são obrigatórios'}), 400

        # Validate courses exist
        courses = Course.query.filter(Course.id.in_(course_ids)).all()

        new_item = Showcase(
            name=name,
            description=description,
            url=url,
            status='inactive',
            priority=priority,
        )
        new_item.courses = courses

        db.session.add(new_item)
        db.session.commit()

        return jsonify({'success': True, 'item': serialize_showcase(new_item)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/items/<int:item_id>', methods=['PUT'])
@admin_required
def update_showcase_item(item_id):
    """Update an existing showcase item."""
    try:
        item = Showcase.query.get_or_404(item_id)
        data = request.get_json()

        if 'name' in data:
            item.name = data['name']
        if 'description' in data:
            item.description = data['description']
        if 'url' in data:
            item.url = data['url']
        if 'priority' in data:
            item.priority = int(data['priority'])
        if 'course_ids' in data:
            courses = Course.query.filter(Course.id.in_(data['course_ids'])).all()
            item.courses = courses

        db.session.commit()
        return jsonify({'success': True, 'item': serialize_showcase(item)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/items/<int:item_id>/image', methods=['POST'])
@admin_required
def upload_showcase_image(item_id):
    """Upload or update an image for a showcase item."""
    try:
        item = Showcase.query.get_or_404(item_id)
        image = request.files.get('image')

        if not image:
            return jsonify({'success': False, 'message': 'Imagem é obrigatória'}), 400

        # Delete old image if exists
        if item.image:
            try:
                os.remove(os.path.join('static/uploads', item.image))
            except OSError:
                pass

        filename = f"showcase_{item.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{image.filename.rsplit('.', 1)[-1]}"
        image.save(os.path.join('static/uploads', filename))
        item.image = filename

        db.session.commit()
        return jsonify({'success': True, 'image': filename})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/items/<int:item_id>/status', methods=['PATCH'])
@admin_required
def update_showcase_status(item_id):
    """Toggle a showcase item's active/inactive status."""
    try:
        item = Showcase.query.get_or_404(item_id)
        data = request.get_json()
        new_status = data.get('status')

        if new_status not in ['active', 'inactive']:
            return jsonify({'success': False, 'message': 'Status inválido'}), 400

        item.status = new_status
        db.session.commit()
        return jsonify({'success': True, 'status': item.status})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@crud_bp.route('/items/<int:item_id>', methods=['DELETE'])
@admin_required
def delete_showcase_item(item_id):
    """Delete a showcase item."""
    try:
        item = Showcase.query.get_or_404(item_id)

        if item.image:
            try:
                os.remove(os.path.join('static/uploads', item.image))
            except OSError:
                pass

        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
