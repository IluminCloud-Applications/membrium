"""CRUD routes for managing admin users (multi-admin support)."""
from flask import Blueprint, request, session, jsonify
from functools import wraps
from werkzeug.security import generate_password_hash
from db.database import db
from models import Admin, Student

admin_users_bp = Blueprint('admin_users', __name__)


def full_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Acesso não autorizado.'}), 403
        admin = Admin.query.get(session['user_id'])
        if not admin:
            return jsonify({'error': 'Acesso não autorizado.'}), 403
        if admin.role != 'admin':
            return jsonify({'error': 'Permissão insuficiente. Apenas administradores completos podem acessar este recurso.'}), 403
        return f(*args, **kwargs)
    return decorated_function


def _get_primary_admin_id():
    """Return the ID of the primary (setup) admin — the one with the smallest ID."""
    primary = db.session.query(Admin.id).order_by(Admin.id.asc()).first()
    return primary[0] if primary else None


def _serialize_admin(admin, primary_id):
    return {
        'id': admin.id,
        'name': admin.name or '',
        'email': admin.email,
        'role': admin.role,
        'is_primary': admin.id == primary_id,
    }


# ─── LIST ────────────────────────────────────────────────────────

@admin_users_bp.route('/api/admin-users', methods=['GET'])
@full_admin_required
def list_admins():
    """List all admin users."""
    primary_id = _get_primary_admin_id()
    admins = Admin.query.order_by(Admin.id.asc()).all()
    return jsonify([_serialize_admin(a, primary_id) for a in admins])


# ─── CREATE ──────────────────────────────────────────────────────

@admin_users_bp.route('/api/admin-users', methods=['POST'])
@full_admin_required
def create_admin():
    """Create a new admin user."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dados inválidos.'}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'support')

    if not email or not password:
        return jsonify({'error': 'E-mail e senha são obrigatórios.'}), 400

    if role not in ('admin', 'support'):
        return jsonify({'error': 'Role inválida. Use "admin" ou "support".'}), 400

    # Check email uniqueness across admins and students
    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Já existe um administrador com este e-mail.'}), 409
    if Student.query.filter_by(email=email).first():
        return jsonify({'error': 'Já existe um aluno com este e-mail.'}), 409

    # Get platform_name from the primary admin
    primary_admin = Admin.query.order_by(Admin.id.asc()).first()
    platform_name = primary_admin.platform_name if primary_admin else 'Plataforma'

    new_admin = Admin(
        name=name or None,
        email=email,
        password=generate_password_hash(password),
        platform_name=platform_name,
        is_installed=True,
        role=role,
    )
    db.session.add(new_admin)
    db.session.commit()

    primary_id = _get_primary_admin_id()
    return jsonify(_serialize_admin(new_admin, primary_id)), 201


# ─── UPDATE ──────────────────────────────────────────────────────

@admin_users_bp.route('/api/admin-users/<int:admin_id>', methods=['PUT'])
@full_admin_required
def update_admin(admin_id):
    """Update an existing admin user."""
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Administrador não encontrado.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dados inválidos.'}), 400

    primary_id = _get_primary_admin_id()

    # Cannot change role of the primary admin
    if 'role' in data and admin.id == primary_id:
        return jsonify({'error': 'Não é possível alterar a role do administrador principal.'}), 400

    if 'name' in data:
        admin.name = (data['name'] or '').strip() or None

    if 'email' in data:
        new_email = data['email'].strip().lower()
        if new_email != admin.email:
            if Admin.query.filter_by(email=new_email).first():
                return jsonify({'error': 'Já existe um administrador com este e-mail.'}), 409
            if Student.query.filter_by(email=new_email).first():
                return jsonify({'error': 'Já existe um aluno com este e-mail.'}), 409
            admin.email = new_email

    if 'password' in data and data['password']:
        admin.password = generate_password_hash(data['password'])

    if 'role' in data and data['role'] in ('admin', 'support'):
        admin.role = data['role']

    db.session.commit()
    return jsonify(_serialize_admin(admin, primary_id))


# ─── DELETE ──────────────────────────────────────────────────────

@admin_users_bp.route('/api/admin-users/<int:admin_id>', methods=['DELETE'])
@full_admin_required
def delete_admin(admin_id):
    """Delete an admin user."""
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Administrador não encontrado.'}), 404

    primary_id = _get_primary_admin_id()

    if admin.id == primary_id:
        return jsonify({'error': 'Não é possível excluir o administrador principal.'}), 400

    if admin.id == session['user_id']:
        return jsonify({'error': 'Não é possível excluir sua própria conta.'}), 400

    db.session.delete(admin)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Administrador excluído com sucesso.'})
