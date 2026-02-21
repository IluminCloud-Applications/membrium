from flask import Blueprint, jsonify, session, request
from functools import wraps
from werkzeug.security import generate_password_hash
from io import StringIO
from db.database import db
from models import Admin, Student, Course
import csv

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
def import_students_csv():
    """Import students from a CSV file."""
    if 'csvFile' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400

    file = request.files['csvFile']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({'success': False, 'message': 'Arquivo deve ser .csv'}), 400

    try:
        stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.reader(stream)

        imported_count = 0
        errors = []

        for i, row in enumerate(csv_input):
            if len(row) < 3:  # name, email, password (minimum)
                errors.append(f'Linha {i + 1}: dados insuficientes')
                continue

            name = row[0].strip()
            email = row[1].strip()
            password = row[2].strip()
            course_id = int(row[3].strip()) if len(row) >= 4 and row[3].strip() else None

            if not name or not email or not password:
                errors.append(f'Linha {i + 1}: campos obrigatórios vazios')
                continue

            # Check if student already exists
            existing = Student.query.filter_by(email=email).first()
            if existing:
                errors.append(f'Linha {i + 1}: email {email} já existe')
                continue

            hashed_password = generate_password_hash(password)
            new_student = Student(email=email, password=hashed_password, name=name)
            db.session.add(new_student)
            db.session.flush()

            if course_id:
                course = Course.query.get(course_id)
                if course:
                    new_student.courses.append(course)

            imported_count += 1

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'{imported_count} alunos importados com sucesso',
            'imported': imported_count,
            'errors': errors,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar arquivo: {str(e)}'}), 500
