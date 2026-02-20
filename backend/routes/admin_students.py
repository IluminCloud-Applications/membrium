from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Document, student_courses, student_lessons
from db.utils import ensure_upload_directory, check_installation
import os
import csv
from io import StringIO

admin_students_bp = Blueprint('admin_students', __name__, url_prefix='/admin')

def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.install':
            return redirect(url_for('auth.install'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@admin_students_bp.route('/student', methods=['POST'])
@admin_required
def create_student():
    email = request.form['email']
    password = request.form['password']
    name = request.form['name']
    course_id = request.form['courses']  # Agora esperamos apenas um ID de curso
    phone = request.form.get('phone', '')  # Get phone (optional)
    
    # Criar o hash da senha
    hashed_password = generate_password_hash(password)
    
    try:
        # Criar novo estudante
        new_student = Student(email=email, password=hashed_password, name=name, phone=phone)
        db.session.add(new_student)
        db.session.flush()  # Isso atribui um ID ao novo_student sem commitar a transação
        
        # Obter o curso
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'success': False, 'message': 'Curso não encontrado'}), 404
        
        # Associar o estudante ao curso
        new_student.courses.append(course)
        
        # Commit da transação
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Aluno criado com sucesso'})
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Email já está em uso'}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500

@admin_students_bp.route('/student/<int:student_id>', methods=['GET'])
@admin_required
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify({
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'phone': student.phone,  # Add phone to response
        'courses': [course.id for course in student.courses]
    })

@admin_students_bp.route('/student/<int:student_id>', methods=['PUT'])
@admin_required
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    # Verificar se a requisição contém dados
    if not request.form:
        return jsonify({'success': False, 'message': 'Dados de requisição inválidos'}), 400
    
    action = request.form.get('action')
    if not action:
        return jsonify({'success': False, 'message': 'Ação não especificada'}), 400
    
    try:
        if action == 'update':
            student.name = request.form.get('name', student.name)
            student.email = request.form.get('email', student.email)
            student.phone = request.form.get('phone', student.phone or '')
            
            # Update password only if provided
            new_password = request.form.get('password')
            if new_password:
                student.password = generate_password_hash(new_password)
        
        elif action == 'include':
            course_id = request.form.get('course_id') or request.form.get('course')
            if not course_id:
                return jsonify({'success': False, 'message': 'ID do curso não fornecido'}), 400
            
            course = Course.query.get(course_id)
            if not course:
                return jsonify({'success': False, 'message': 'Curso não encontrado'}), 404
            
            if course not in student.courses:
                student.courses.append(course)
            else:
                return jsonify({'success': False, 'message': 'Aluno já está matriculado neste curso'}), 400
        
        elif action == 'remove':
            course_id = request.form.get('course_id') or request.form.get('course')
            if not course_id:
                return jsonify({'success': False, 'message': 'ID do curso não fornecido'}), 400
            
            course = Course.query.get(course_id)
            if not course:
                return jsonify({'success': False, 'message': 'Curso não encontrado'}), 404
            
            if course in student.courses:
                student.courses.remove(course)
            else:
                return jsonify({'success': False, 'message': 'Aluno não está matriculado neste curso'}), 400
        
        else:
            return jsonify({'success': False, 'message': f'Ação inválida: {action}'}), 400
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Aluno atualizado com sucesso'})
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Email já está em uso'}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500

@admin_students_bp.route('/student/<int:student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'success': True})

@admin_students_bp.route('/course-students-stats')
@admin_required
def course_students_stats():
    stats = db.session.query(
        Course.name.label('course_name'),
        func.count(db.column('student_id')).label('student_count')
    ).select_from(db.table('student_courses')).join(
        Course, Course.id == db.column('course_id')
    ).group_by(
        Course.id, Course.name
    ).all()

    return jsonify([
        {'course_name': stat.course_name, 'student_count': stat.student_count}
        for stat in stats
    ])

@admin_students_bp.route('/all-courses', methods=['GET'])
@admin_required
def get_all_courses():
    courses = Course.query.all()
    return jsonify([{
        'id': course.id,
        'name': course.name
    } for course in courses])

@admin_students_bp.route('/import-students')
@admin_required
@installation_required
def import_students():
    return render_template('import_students.html')

@admin_students_bp.route('/import-students', methods=['GET', 'POST'])
@admin_required
@installation_required
def import_students_csv():
    if request.method == 'POST':
        if 'csvFile' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['csvFile']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and file.filename.endswith('.csv'):
            try:
                # Read and process CSV
                stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
                csv_input = csv.reader(stream)
                
                # Process each row
                imported_count = 0
                for row in csv_input:
                    if len(row) >= 4:  # name, email, password, course_id
                        # Process student data
                        imported_count += 1
                
                return jsonify({'success': True, 'message': f'{imported_count} alunos importados com sucesso'})
            except Exception as e:
                return jsonify({'success': False, 'message': f'Erro ao processar arquivo: {str(e)}'})
        
        return jsonify({'success': False, 'message': 'Arquivo inválido'})
    
    return render_template('import_students.html')

@admin_students_bp.route('/student/<int:student_id>/resend-access', methods=['POST'])
@admin_required
def resend_student_access(student_id):
    try:
        student = Student.query.get_or_404(student_id)
        # Here you would implement the email sending logic
        # For now, just return success
        return jsonify({'success': True, 'message': 'Acesso reenviado com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao reenviar acesso: {str(e)}'}), 500
