from flask import Blueprint, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db.database import db
from models import Admin, Student
from db.utils import check_installation

auth_bp = Blueprint('auth', __name__)


def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================
# API ENDPOINTS (JSON) — used by React frontend
# ============================================

@auth_bp.route('/api/auth/check-install', methods=['GET'])
def api_check_install():
    """Check if the platform is already installed"""
    installed = check_installation()
    data = {'installed': installed}

    if installed:
        admin = Admin.query.first()
        data['platform_name'] = admin.platform_name if admin else 'Membrium'

    return jsonify(data)


@auth_bp.route('/api/auth/install', methods=['POST'])
def api_install():
    """Setup (first install) — create admin + platform"""
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


@auth_bp.route('/api/auth/login', methods=['POST'])
def api_login():
    """Login as admin or student (JSON API)"""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'E-mail e senha são obrigatórios'}), 400

    # Try admin
    admin = Admin.query.filter_by(email=email).first()
    if admin and check_password_hash(admin.password, password):
        session.permanent = True
        session['user_id'] = admin.id
        session['user_type'] = 'admin'
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso!',
            'user': {
                'id': admin.id,
                'type': 'admin',
                'email': admin.email,
                'name': admin.name or 'Admin',
            },
        })

    # Try student
    student = Student.query.filter_by(email=email).first()
    if student and check_password_hash(student.password, password):
        session.permanent = True
        session['user_id'] = student.id
        session['user_type'] = 'student'
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso!',
            'user': {
                'id': student.id,
                'type': 'student',
                'email': student.email,
                'name': student.name,
            },
        })

    return jsonify({'success': False, 'message': 'Email ou senha inválidos.'}), 401


@auth_bp.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """Logout current user"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso!'})


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    """Reset student password"""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    email = data.get('email', '').strip()
    new_password = data.get('newPassword', '')

    if not email or not new_password:
        return jsonify({'success': False, 'message': 'E-mail e nova senha são obrigatórios'}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'success': False, 'message': 'Email não encontrado'}), 404

    hashed_password = generate_password_hash(new_password)
    student.password = hashed_password
    db.session.commit()

    return jsonify({'success': True, 'message': 'Senha redefinida com sucesso!'})


@auth_bp.route('/api/auth/me', methods=['GET'])
def api_me():
    """Get current user info (check session)"""
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401

    user_type = session.get('user_type')

    if user_type == 'admin':
        admin = Admin.query.get(session['user_id'])
        if admin:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': admin.id,
                    'type': 'admin',
                    'email': admin.email,
                    'name': admin.name or 'Admin',
                },
            })
    elif user_type == 'student':
        student = Student.query.get(session['user_id'])
        if student:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': student.id,
                    'type': 'student',
                    'email': student.email,
                    'name': student.name,
                },
            })

    session.clear()
    return jsonify({'authenticated': False}), 401


@auth_bp.route('/api/auth/quick-access/<uuid>', methods=['POST'])
def api_quick_access(uuid):
    """Quick access — authenticate student by UUID token (JSON API)"""
    student = Student.query.filter_by(uuid=uuid).first()
    if not student:
        return jsonify({'success': False, 'message': 'Link de acesso inválido'}), 404

    session.permanent = True
    session['user_id'] = student.id
    session['user_type'] = 'student'
    return jsonify({
        'success': True,
        'message': 'Acesso rápido realizado com sucesso!',
        'user': {
            'id': student.id,
            'type': 'student',
            'email': student.email,
            'name': student.name,
        },
    })


# ============================================
# LEGACY TEMPLATE ROUTES — kept for backward compat
# ============================================

@auth_bp.route('/')
def index():
    if 'user_id' in session:
        if 'user_type' in session:
            if session['user_type'] == 'admin':
                return redirect(url_for('admin.admin_panel'))
            elif session['user_type'] == 'student':
                return redirect('/member')

    if check_installation():
        return redirect(url_for('auth.login'))
    else:
        return redirect(url_for('auth.install'))


@auth_bp.route('/install', methods=['GET', 'POST'])
def install():
    if check_installation():
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        platform_name = request.form['platform_name']
        email = request.form['email']
        password = request.form['password']

        hashed_password = generate_password_hash(password)
        new_admin = Admin(
            email=email,
            password=hashed_password,
            platform_name=platform_name,
            is_installed=True,
        )

        db.create_all()
        db.session.add(new_admin)
        db.session.commit()

        return redirect(url_for('auth.login'))

    from flask import render_template
    return render_template('installation.html')


@auth_bp.route('/installation', methods=['GET'])
def installation_redirect():
    if check_installation():
        return redirect(url_for('auth.login'))
    else:
        return redirect(url_for('auth.install'))


@auth_bp.route('/login', methods=['GET', 'POST'])
@installation_required
def login():
    if 'user_id' in session:
        if session['user_type'] == 'admin':
            return redirect(url_for('admin.admin_panel'))
        elif session['user_type'] == 'student':
            return redirect(url_for('student.dashboard'))

    admin = Admin.query.first()
    platform_name = admin.platform_name if admin else 'MembriumWL'

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        admin = Admin.query.filter_by(email=email).first()
        if admin and check_password_hash(admin.password, password):
            session['user_id'] = admin.id
            session['user_type'] = 'admin'
            return redirect(url_for('admin.admin_panel'))

        student = Student.query.filter_by(email=email).first()
        if student and check_password_hash(student.password, password):
            session['user_id'] = student.id
            session['user_type'] = 'student'
            return redirect('/member')

    from flask import render_template, flash
    flash('Email ou senha inválidos.', 'error')
    return render_template('login.html', platform_name=platform_name)


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))


@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    admin = Admin.query.first()
    platform_name = admin.platform_name if admin else 'MembriumWL'
    from flask import render_template
    return render_template('forgot_password.html', platform_name=platform_name)


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('newPassword')

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'success': False, 'message': 'Email não encontrado'}), 404

    hashed_password = generate_password_hash(new_password)
    student.password = hashed_password
    db.session.commit()

    return jsonify({'success': True, 'message': 'Senha redefinida com sucesso!'})


@auth_bp.route('/access/<uuid>')
def quick_access(uuid):
    """Legacy quick access — redirect to frontend route"""
    return redirect(f'/quick-access/{uuid}')


