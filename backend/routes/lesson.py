from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort
from functools import wraps
from datetime import datetime
from werkzeug.utils import secure_filename
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Document, student_lessons
from db.utils import format_description, ensure_upload_directory, check_installation
import os

lesson_bp = Blueprint('lesson', __name__)

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

# Admin lesson routes
@lesson_bp.route('/admin/module/<int:module_id>/lesson', methods=['POST'])
@admin_required
def create_lesson(module_id):
    module = Module.query.get_or_404(module_id)
    title = request.form['title']
    description = request.form['description']
    video_url = request.form['video_url']
    video_type = request.form['video_type']
    
    has_button = request.form.get('has_button', 'false').lower() == 'true'
    button_text = request.form.get('button_text') if has_button else None
    button_link = request.form.get('button_link') if has_button else None
    button_delay = request.form.get('appearance_time')

    # Converter para inteiro se não for None ou string vazia
    if button_delay and button_delay.strip():
        button_delay = int(button_delay)
    else:
        button_delay = None

    new_lesson = Lesson(
        title=title, 
        description=description, 
        video_url=video_url, 
        video_type=video_type, 
        module=module, 
        order=len(module.lessons) + 1,
        has_button=has_button,
        button_text=button_text,
        button_link=button_link,
        button_delay=button_delay
    )
    db.session.add(new_lesson)
    
    documents = request.files.getlist('documents')
    for doc in documents:
        if doc:
            ensure_upload_directory()
            filename = secure_filename(f"doc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{doc.filename}")
            doc.save(os.path.join('static/uploads', filename))
            new_document = Document(filename=filename, lesson=new_lesson)
            db.session.add(new_document)
    
    db.session.commit()
    return jsonify({
        'success': True, 
        'lesson': {
            'id': new_lesson.id,
            'title': new_lesson.title,
            'description': new_lesson.description,
            'video_url': new_lesson.video_url,
            'video_type': new_lesson.video_type,
            'order': new_lesson.order,
            'has_button': new_lesson.has_button,
            'button_text': new_lesson.button_text,
            'button_link': new_lesson.button_link,
            'button_delay': new_lesson.button_delay
        }
    })

@lesson_bp.route('/admin/lesson/<int:lesson_id>', methods=['PUT'])
@admin_required
def update_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    lesson.title = request.form['title']
    lesson.description = request.form['description']
    lesson.video_url = request.form['video_url']
    lesson.video_type = request.form['video_type']
    
    has_button = request.form.get('has_button', 'false').lower() == 'true'
    lesson.has_button = has_button
    lesson.button_text = request.form.get('button_text') if has_button else None
    lesson.button_link = request.form.get('button_link') if has_button else None
    button_delay = request.form.get('appearance_time')

    if button_delay and button_delay.strip():
        lesson.button_delay = int(button_delay)
    else:
        lesson.button_delay = None
    
    documents = request.files.getlist('documents')
    for doc in documents:
        if doc:
            ensure_upload_directory()
            filename = secure_filename(f"doc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{doc.filename}")
            doc.save(os.path.join('static/uploads', filename))
            new_document = Document(filename=filename, lesson=lesson)
            db.session.add(new_document)
    
    db.session.commit()
    return jsonify({
        'success': True,
        'lesson': {
            'id': lesson.id,
            'title': lesson.title,
            'description': lesson.description,
            'video_url': lesson.video_url,
            'video_type': lesson.video_type,
            'order': lesson.order,
            'has_button': lesson.has_button,
            'button_text': lesson.button_text,
            'button_link': lesson.button_link,
            'button_delay': lesson.button_delay
        }
    })

@lesson_bp.route('/admin/lesson/<int:lesson_id>', methods=['DELETE'])
@admin_required
def delete_lesson(lesson_id):
    try:
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # 1. Remover FAQs relacionados à aula
        from models import FAQ
        faqs = FAQ.query.filter_by(lesson_id=lesson_id).all()
        for faq in faqs:
            db.session.delete(faq)
        
        # 2. Remover transcrições relacionadas à aula
        from models import LessonTranscript
        transcript = LessonTranscript.query.filter_by(lesson_id=lesson_id).first()
        if transcript:
            db.session.delete(transcript)
        
        # 3. Remover arquivos físicos e registros dos documentos
        for doc in lesson.documents[:]:
            try:
                file_path = os.path.join('static/uploads', doc.filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass  # Continue even if file deletion fails
            db.session.delete(doc)
        
        # 4. Remover a aula (student_lessons será removido automaticamente pelo SQLAlchemy)
        db.session.delete(lesson)
        db.session.commit()
        
        flash('Aula excluída com sucesso!', 'success')
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erro ao deletar aula: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Erro ao deletar aula'}), 500

@lesson_bp.route('/admin/reorder_lessons', methods=['POST'])
@admin_required
def reorder_lessons():
    new_order = request.json['new_order']
    for index, lesson_id in enumerate(new_order, start=1):
        lesson = Lesson.query.get(lesson_id)
        lesson.order = index
    db.session.commit()
    return jsonify({'success': True})

@lesson_bp.route('/admin/lesson/<int:lesson_id>/files', methods=['GET'])
@admin_required
def get_lesson_files(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    files = [{'id': doc.id, 'filename': doc.filename} for doc in lesson.documents]
    return jsonify(files)

@lesson_bp.route('/admin/lesson/<int:lesson_id>/file/<int:file_id>', methods=['DELETE'])
@admin_required
def delete_lesson_file(lesson_id, file_id):
    document = Document.query.get_or_404(file_id)
    
    # Verificar se o arquivo pertence à aula
    if document.lesson_id != lesson_id:
        return jsonify({'success': False, 'message': 'Arquivo não pertence a esta aula'}), 400
    
    try:
        # Remover arquivo físico
        os.remove(os.path.join('static/uploads', document.filename))
        
        # Remover registro do banco de dados
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao deletar arquivo: {str(e)}'}), 500

# Student lesson routes
@lesson_bp.route('/lesson/<int:lesson_id>')
@student_required
def lesson_view(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return render_template('module_lessons.html', lesson=lesson)

# Rota para obter detalhes de uma aula específica (se necessário)
@lesson_bp.route('/api/preview_lesson/<int:lesson_id>')
@admin_required
def api_preview_lesson_details(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify({
        'id': lesson.id,
        'title': lesson.title,
        'description': lesson.description,
        'video_url': lesson.video_url,
        'video_type': lesson.video_type,
        'documents': [{'id': doc.id, 'filename': doc.filename} for doc in lesson.documents]
    })

@lesson_bp.route('/mark_lesson_completed', methods=['POST'])
@student_required
def mark_lesson_completed():
    data = request.json
    lesson_id = data.get('lesson_id')
    student_id = session['user_id']

    if not lesson_id:
        return jsonify({'success': False, 'message': 'ID da lição não fornecido'}), 400

    # Verifica se já existe um registro para esta lição e este aluno
    existing_record = db.session.query(student_lessons).filter_by(
        student_id=student_id, lesson_id=lesson_id
    ).first()

    if existing_record:
        return jsonify({'success': True, 'message': 'Lesson already marked as completed'})

    # Adiciona um novo registro na tabela student_lessons
    new_record = student_lessons.insert().values(student_id=student_id, lesson_id=lesson_id)
    db.session.execute(new_record)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Lesson marked as completed'})
