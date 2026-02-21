from flask import Blueprint, Response, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from db.database import db
from models import Admin, Student, Course
import json

import_students_bp = Blueprint('import_students', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@import_students_bp.route('/import', methods=['POST'])
@admin_required
def import_students():
    """
    Import students from a JSON payload with streaming progress.

    Body (JSON):
        students: [{ name: str, email: str }]
        courseIds: [int]
        sendEmail: bool
        defaultPassword: str  (optional, defaults to 'senha123')
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    student_list = data.get('students', [])
    course_ids = data.get('courseIds', [])
    default_password = data.get('defaultPassword', 'senha123').strip()

    if not student_list:
        return jsonify({'success': False, 'message': 'Nenhum aluno para importar'}), 400

    if not default_password:
        default_password = 'senha123'

    # Resolve courses
    courses = []
    for cid in course_ids:
        course = Course.query.get(cid)
        if course:
            courses.append(course)

    def generate():
        total = len(student_list)
        imported = 0
        skipped = 0
        errors = []

        for i, entry in enumerate(student_list):
            name = entry.get('name', '').strip()
            email = entry.get('email', '').strip().lower()

            if not email:
                errors.append(f'Linha {i + 1}: email vazio')
                skipped += 1
                yield json.dumps({
                    'progress': {
                        'current': i + 1,
                        'total': total,
                        'imported': imported,
                        'skipped': skipped,
                    }
                }) + '\n'
                continue

            if not name:
                name = email.split('@')[0]

            # Check existing
            existing = Student.query.filter(
                Student.email.ilike(email)
            ).first()

            if existing:
                # Add courses to existing student
                for c in courses:
                    if c not in existing.courses:
                        existing.courses.append(c)
                db.session.commit()
                skipped += 1
            else:
                # Create new student
                hashed = generate_password_hash(default_password)
                new_student = Student(email=email, password=hashed, name=name)
                db.session.add(new_student)
                db.session.flush()
                for c in courses:
                    new_student.courses.append(c)
                db.session.commit()
                imported += 1

            yield json.dumps({
                'progress': {
                    'current': i + 1,
                    'total': total,
                    'imported': imported,
                    'skipped': skipped,
                }
            }) + '\n'

        yield json.dumps({
            'done': True,
            'imported': imported,
            'skipped': skipped,
            'total': total,
            'errors': errors,
        }) + '\n'

    return Response(generate(), mimetype='application/x-ndjson')
