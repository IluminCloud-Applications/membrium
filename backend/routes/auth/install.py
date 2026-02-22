"""Install routes — first-time platform setup."""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db.database import db
from models import Admin
from db.utils import check_installation

install_bp = Blueprint('install', __name__)


@install_bp.route('/api/auth/check-install', methods=['GET'])
def api_check_install():
    """Check if the platform is already installed."""
    installed = check_installation()
    data = {'installed': installed}

    if installed:
        admin = Admin.query.first()
        data['platform_name'] = admin.platform_name if admin else 'Membrium'

    return jsonify(data)


@install_bp.route('/api/auth/install', methods=['POST'])
def api_install():
    """Setup (first install) — create admin + platform."""
    if check_installation():
        return jsonify({'success': False, 'message': 'Plataforma já instalada'}), 400

    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    platform_name = data.get('platform_name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    if not platform_name or not email or not password:
        return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios'}), 400

    hashed_password = generate_password_hash(password)
    new_admin = Admin(
        name=name or None,
        email=email,
        password=hashed_password,
        platform_name=platform_name,
        is_installed=True,
    )

    db.create_all()
    db.session.add(new_admin)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Instalação concluída com sucesso!'})
