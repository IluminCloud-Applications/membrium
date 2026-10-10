from flask import Blueprint, jsonify, session, request
from auth_decorators import admin_required
from functools import wraps
from models import Admin, Student

check_email_bp = Blueprint('check_email', __name__)


@check_email_bp.route('/check-email', methods=['GET'])
@admin_required
def check_email():
    """
    Check if a student with the given email already exists.

    Query params:
        email (str)      — email to check
        exclude_id (int) — optional student id to exclude (for edit mode)
    """
    email = request.args.get('email', '').strip().lower()
    exclude_id = request.args.get('exclude_id', type=int)

    if not email:
        return jsonify({'exists': False})

    query = Student.query.filter(Student.email.ilike(email))
    if exclude_id:
        query = query.filter(Student.id != exclude_id)

    exists = query.first() is not None

    return jsonify({'exists': exists})
