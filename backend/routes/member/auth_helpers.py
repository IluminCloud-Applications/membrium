"""Centralized auth decorators for the member area."""
from flask import session, request, jsonify
from functools import wraps
from models import Student, Admin


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


def member_or_preview(f):
    """Allows access for students OR admins in preview mode (?preview=true).

    - If student: injects student as first arg (normal behavior)
    - If admin + preview=true: injects None as first arg (no student context)
    - Otherwise: 401
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Não autorizado'}), 401

        user_type = session.get('user_type')
        is_preview = request.args.get('preview') == 'true'

        # Admin in preview mode
        if user_type == 'admin' and is_preview:
            admin = Admin.query.get(session['user_id'])
            if not admin:
                return jsonify({'error': 'Admin não encontrado'}), 401
            return f(None, *args, **kwargs)

        # Regular student access
        if user_type == 'student':
            student = Student.query.get(session['user_id'])
            if not student:
                return jsonify({'error': 'Aluno não encontrado'}), 401
            return f(student, *args, **kwargs)

        return jsonify({'error': 'Não autorizado'}), 401
    return decorated
