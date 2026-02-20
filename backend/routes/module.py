from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from datetime import datetime
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Document, student_lessons
from db.utils import format_description, ensure_upload_directory, check_installation
import os

module_bp = Blueprint('module', __name__)

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

def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin module routes
@module_bp.route('/admin/course/<int:course_id>/module', methods=['POST'])
@admin_required
def create_module(course_id):
    course = Course.query.get_or_404(course_id)
    name = request.form['name']
    image = request.files['image']
    
    if image:
        ensure_upload_directory()
        filename = f"module_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
        image.save(os.path.join('static/uploads', filename))
    else:
        filename = None
    
    new_module = Module(name=name, image=filename, course=course, order=len(course.modules) + 1)
    db.session.add(new_module)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'module': {
            'id': new_module.id,
            'name': new_module.name,
            'image': new_module.image,
            'order': new_module.order
        }
    })

@module_bp.route('/admin/module/<int:module_id>', methods=['PUT'])
@admin_required
def update_module(module_id):
    try:
        module = Module.query.get_or_404(module_id)
        module.name = request.form['name']
        
        image = request.files.get('image')
        if image:
            ensure_upload_directory()
            filename = f"module_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            image.save(os.path.join('static/uploads', filename))
            
            # Remove old image if exists
            if module.image:
                old_image_path = os.path.join('static/uploads', module.image)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            module.image = filename
        
        db.session.commit()
        flash('Módulo atualizado com sucesso!', 'success')
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Erro ao atualizar módulo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao atualizar módulo'}), 500

@module_bp.route('/admin/module/<int:module_id>', methods=['DELETE'])
@admin_required
def delete_module(module_id):
    try:
        module = Module.query.get_or_404(module_id)
        
        # 1. Deletar todas as aulas do módulo (que por sua vez deletará seus dependentes)
        from models import Lesson, FAQ, LessonTranscript, Document
        lessons = Lesson.query.filter_by(module_id=module_id).all()
        
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
                    pass  # Continue even if file deletion fails
                db.session.delete(doc)
            
            # Deletar a aula
            db.session.delete(lesson)
        
        # 2. Remover imagem do módulo se existir
        if module.image:
            image_path = os.path.join('static/uploads', module.image)
            if os.path.exists(image_path):
                os.remove(image_path)
        
        # 3. Deletar o módulo
        db.session.delete(module)
        db.session.commit()
        
        flash('Módulo excluído com sucesso!', 'success')
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Erro ao deletar módulo: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar módulo'}), 500

@module_bp.route('/admin/reorder_modules', methods=['POST'])
@admin_required
def reorder_modules():
    new_order = request.json['new_order']
    for index, module_id in enumerate(new_order, start=1):
        module = Module.query.get(module_id)
        module.order = index
    db.session.commit()
    return jsonify({'success': True})

# Student module routes
@module_bp.route('/course/<int:course_id>/module/<int:module_id>/lesson/<int:lesson_order>')
@student_required
def module_view(course_id, module_id, lesson_order):
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
    
    lessons = Lesson.query.filter_by(module_id=module_id).order_by(Lesson.order).all()
    
    if lesson_order < 1 or lesson_order > len(lessons):
        return redirect(url_for('module.module_view', course_id=course_id, module_id=module_id, lesson_order=1))
    
    current_lesson = next((lesson for lesson in lessons if lesson.order == lesson_order), None)
    if not current_lesson:
        abort(404)
    
    # Formatar a descrição da lição
    formatted_description = format_description(current_lesson.description)
    
    # Buscar o documento associado à lição
    document = Document.query.filter_by(lesson_id=current_lesson.id).first()
    
    # Verificar se a lição já foi assistida pelo aluno
    student_id = session['user_id']
    lesson_completed = db.session.query(student_lessons).filter_by(
        student_id=student_id, lesson_id=current_lesson.id
    ).first() is not None
    
    return render_template('module_lessons.html', 
                           course=course,
                           module=module,
                           lessons=lessons,
                           current_lesson=current_lesson,
                           formatted_description=formatted_description,
                           document=document,
                           lesson_completed=lesson_completed,
                           has_button=current_lesson.has_button,
                           button_text=current_lesson.button_text,
                           button_link=current_lesson.button_link,
                           button_delay=current_lesson.button_delay)

# Rota para a pré-visualização das aulas de um módulo
@module_bp.route('/preview_course/<int:course_id>/module/<int:module_id>/lesson/<int:lesson_order>')
@admin_required
def preview_lessons(course_id, module_id, lesson_order):
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course_id).first_or_404()
    
    lessons = Lesson.query.filter_by(module_id=module_id).order_by(Lesson.order).all()
    
    if lesson_order < 1 or lesson_order > len(lessons):
        return redirect(url_for('module.preview_lessons', course_id=course_id, module_id=module_id, lesson_order=1))
    
    current_lesson = next((lesson for lesson in lessons if lesson.order == lesson_order), None)
    if not current_lesson:
        abort(404)
    
    # Formatar a descrição da lição
    formatted_description = format_description(current_lesson.description)
    
    document = Document.query.filter_by(lesson_id=current_lesson.id).first()
    
    return render_template('preview_lessons.html', 
                           course=course,
                           module=module,
                           lessons=lessons,
                           current_lesson=current_lesson,
                           formatted_description=formatted_description,
                           document=document)
