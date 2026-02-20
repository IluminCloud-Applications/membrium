from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort, url_for
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

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

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

@admin_bp.before_request
def check_admin_routes():
    if 'user_type' not in session or session['user_type'] != 'admin':
        return redirect(url_for('auth.login'))

@admin_bp.route('/')
@admin_required
@installation_required
def admin_panel():
    # Verificar se o usuário atual é realmente um administrador
    current_user_id = session.get('user_id')
    current_user = Admin.query.get(current_user_id)
    
    if not current_user:
        # Se o usuário não for encontrado na tabela Admin, negue o acesso
        abort(403)  # Forbidden

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # Se for uma requisição AJAX, retorne o nome da plataforma
        return jsonify({'platform_name': current_user.platform_name})
    else:
        # Se for uma requisição normal, renderize o painel de administração
        courses = Course.query.all()
        return render_template('admin_panel.html', courses=courses)

@admin_bp.route('/courses', methods=['GET'])
@admin_required
@installation_required
def get_courses():
    courses = Course.query.all()
    return jsonify([{
        'id': course.id,
        'uuid': course.uuid,
        'name': course.name,
        'description': course.description,
        'image_url': url_for('static', filename=f'uploads/{course.image}') if course.image else None
    } for course in courses])

@admin_bp.route('/students-panel')
@admin_required
@installation_required
def students_panel():
    # Renderiza a página do painel de alunos
    return render_template('students_panel.html')

@admin_bp.route('/course', methods=['POST'])
@admin_required
def create_course():
    name = request.form['name']
    description = request.form['description']
    image = request.files.get('image')
    
    if image:
        ensure_upload_directory()
        filename = f"course_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
        image.save(os.path.join('static/uploads', filename))
    else:
        filename = None
    
    new_course = Course(name=name, description=description, image=filename)
    db.session.add(new_course)
    db.session.commit()
    
    return jsonify({'success': True})

@admin_bp.route('/course/<int:course_id>', methods=['PUT'])
@admin_required
def update_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        course.name = request.form['name']
        course.description = request.form['description']
        
        image = request.files.get('image')
        if image:
            ensure_upload_directory()
            filename = f"course_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            image.save(os.path.join('static/uploads', filename))
            
            # Remove old image if exists
            if course.image:
                old_image_path = os.path.join('static/uploads', course.image)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            course.image = filename
        
        db.session.commit()
        flash('Curso atualizado com sucesso!', 'success')
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Erro ao atualizar curso: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao atualizar curso'}), 500

@admin_bp.route('/course/<int:course_id>', methods=['GET'])
@admin_required
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({
        'id': course.id,
        'name': course.name,
        'description': course.description,
        'image_url': url_for('static', filename=f'uploads/{course.image}') if course.image else None
    })

@admin_bp.route('/course/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        
        # 1. Deletar todas as vitrines relacionadas ao curso
        from models import Showcase, Module, Lesson, FAQ, LessonTranscript, Document
        showcases = Showcase.query.filter_by(course_id=course_id).all()
        for showcase in showcases:
            # Remover imagem da vitrine se existir
            if showcase.image:
                image_path = os.path.join('static/uploads', showcase.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            db.session.delete(showcase)
        
        # 2. Deletar todos os módulos do curso (que por sua vez deletará suas aulas e dependentes)
        modules = Module.query.filter_by(course_id=course_id).all()
        for module in modules:
            # Deletar todas as aulas do módulo
            lessons = Lesson.query.filter_by(module_id=module.id).all()
            for lesson in lessons:
                # Deletar FAQs da aula
                faqs = FAQ.query.filter_by(lesson_id=lesson.id).all()
                for faq in faqs:
                    db.session.delete(faq)
                
                # Deletar transcrições da aula
                transcript = LessonTranscript.query.filter_by(lesson_id=lesson.id).first()
                if transcript:
                    db.session.delete(transcript)
                
                # Deletar documentos da aula
                for doc in lesson.documents[:]:
                    try:
                        file_path = os.path.join('static/uploads', doc.filename)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except Exception:
                        pass
                    db.session.delete(doc)
                
                # Deletar a aula
                db.session.delete(lesson)
            
            # Remover imagem do módulo se existir
            if module.image:
                image_path = os.path.join('static/uploads', module.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            
            # Deletar o módulo
            db.session.delete(module)
        
        # 3. Remover imagem do curso se existir
        if course.image:
            image_path = os.path.join('static/uploads', course.image)
            if os.path.exists(image_path):
                os.remove(image_path)
        
        # 4. Deletar o curso
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Curso excluído com sucesso'})
    
    except Exception as e:
        print(f"Erro ao deletar curso: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar curso'}), 500

@admin_bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    search = request.args.get('search', '')
    course_filter = request.args.get('course', '')

    query = Student.query

    if search:
        query = query.filter(or_(
            Student.name.ilike(f'%{search}%'),
            Student.email.ilike(f'%{search}%')
        ))
    
    # Adiciona filtro por curso se um ID de curso for fornecido
    if course_filter:
        try:
            course_id = int(course_filter)
            query = query.join(student_courses).filter(student_courses.c.course_id == course_id)
        except (ValueError, TypeError):
            pass  # Ignora filtros inválidos

    students = query.order_by(Student.name).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'students': [{
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'phone': student.phone,
            'uuid': student.uuid,
            'courses': [{'id': course.id, 'name': course.name} for course in student.courses]
        } for student in students.items],
        'pages': students.pages,
        'current_page': page
    })

@admin_bp.route('/total-students', methods=['GET'])
@admin_required
def get_total_students():
    total = Student.query.count()
    return jsonify({'total': total})

@admin_bp.route('/total-lessons', methods=['GET'])
@admin_required
def get_total_lessons():
    total = Lesson.query.count()  # Count total lessons
    return jsonify({'total': total})

@admin_bp.route('/all-courses', methods=['GET'])
@admin_required
def get_all_courses():
    courses = Course.query.all()
    return jsonify([{
        'id': course.id,
        'name': course.name
    } for course in courses])

@admin_bp.route('/import-students')
@admin_required
@installation_required
def import_students():
    return render_template('import_students.html')
