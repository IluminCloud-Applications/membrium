from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, abort, url_for
from functools import wraps
from werkzeug.utils import secure_filename
from datetime import datetime
from db.database import db
from models import Course, Admin, Student, Module, Lesson, Document, Showcase, Promotion
from db.utils import ensure_upload_directory, check_installation
import os
import re

file_manager_bp = Blueprint('file_manager', __name__, url_prefix='/admin')

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

@file_manager_bp.route('/file-manager')
@admin_required
@installation_required
def file_manager():
    # Renderiza a página do gerenciador de arquivos
    return render_template('file_manager.html')

@file_manager_bp.route('/files', methods=['GET'])
@admin_required
def get_files():
    # Parâmetros de paginação e filtro
    page = request.args.get('page', 1, type=int)
    per_page = 12  # 12 arquivos por página (3 linhas de 4 colunas)
    file_type = request.args.get('fileType', 'all')
    status = request.args.get('status', 'all')
    search = request.args.get('search', '')
    
    # Listar todos os arquivos físicos na pasta uploads
    uploads_dir = os.path.join('static', 'uploads')
    physical_files = []
    
    try:
        physical_files = os.listdir(uploads_dir)
    except Exception as e:
        return jsonify({
            'files': [],
            'totalPages': 0,
            'currentPage': page,
            'stats': {'totalFiles': 0, 'unusedFiles': 0, 'totalSize': 0}
        })
    
    # Obter todos os documentos no banco de dados
    db_files = Document.query.all()
    db_filenames = {doc.filename: doc for doc in db_files}
    
    # Obter todas as imagens de curso em uso
    course_images = {course.image for course in Course.query.filter(Course.image.isnot(None)).all()}
    
    # Obter todos os IDs de curso para verificar capas
    course_ids = {course.id for course in Course.query.all()}
    
    # Obter todas as imagens de módulo em uso
    module_images = {module.image for module in Module.query.filter(Module.image.isnot(None)).all()}
    
    # Obter entradas de vitrine e promoções de imagem
    showcase_entries = Showcase.query.filter(Showcase.image.isnot(None)).all()
    promo_entries = Promotion.query.filter(Promotion.media_type=='image').all()
    
    # Preparar a lista de arquivos
    all_files = []
    for filename in physical_files:
        file_path = os.path.join(uploads_dir, filename)
        
        # Verificar se é um arquivo (não uma pasta)
        if not os.path.isfile(file_path):
            continue
        
        # Verificar filtro de tipo
        is_image = bool(re.search(r'\.(jpg|jpeg|png|gif|webp)$', filename, re.IGNORECASE))
        is_document = bool(re.search(r'\.(pdf|doc|docx|xls|xlsx|csv|txt)$', filename, re.IGNORECASE))
        
        if file_type == 'image' and not is_image:
            continue
        elif file_type == 'document' and not is_document:
            continue
        
        # Verificar a busca
        if search and search.lower() not in filename.lower():
            continue
        
        # Determinar se o arquivo está em uso com base em seu tipo
        is_used = False
        used_in = []

        # 1. Verificar se é uma imagem de capa (cover_*.jpg)
        cover_match = re.match(r'^cover_(\d+)\.jpg$', filename)
        if cover_match:
            course_id = int(cover_match.group(1))
            if course_id in course_ids:
                is_used = True
                used_in.append(f'Capa do curso ID {course_id}')
        elif filename in course_images:
            is_used = True
            used_in.append('Imagem de curso')
        elif filename in module_images:
            is_used = True
            used_in.append('Imagem de módulo')
        elif filename in db_filenames:
            is_used = True
            used_in.append('Documento de aula')

        # Verificar se é imagem de vitrine (showcase)
        for item in showcase_entries:
            if item.image == filename:
                is_used = True
                used_in.append('Imagem de vitrine')

        # Verificar se é imagem de promoção (promotion)
        for promo in promo_entries:
            if promo.media_url == filename:
                is_used = True
                used_in.append('Imagem de promoção')

        # Verificar filtro de status
        if status == 'used' and not is_used:
            continue
        elif status == 'unused' and is_used:
            continue
        
        # Obter o tamanho do arquivo
        try:
            size = os.path.getsize(file_path)
        except:
            size = 0
        
        # Obter data de upload (data de criação do arquivo)
        try:
            upload_date = datetime.fromtimestamp(os.path.getctime(file_path))
        except:
            upload_date = datetime.now()
        
        # Criar entrada para o arquivo
        all_files.append({
            'id': db_filenames[filename].id if filename in db_filenames else -1,
            'filename': filename,
            'is_used': is_used,
            'used_in': used_in,
            'size': size,
            'upload_date': upload_date.strftime('%Y-%m-%d')
        })
    
    # Ordenar por data de upload (mais recentes primeiro)
    all_files.sort(key=lambda x: x['upload_date'], reverse=True)
    
    # Paginação manual
    total_files = len(all_files)
    total_pages = (total_files + per_page - 1) // per_page  # Ceiling division
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, total_files)
    paginated_files = all_files[start_idx:end_idx]
    
    # Contar arquivos não utilizados
    unused_files = sum(1 for file in all_files if not file['is_used'])
    
    # Calcular o espaço total utilizado
    total_size = sum(file['size'] for file in all_files)
    
    stats = {
        'totalFiles': total_files,
        'unusedFiles': unused_files,
        'totalSize': total_size
    }
    
    return jsonify({
        'files': paginated_files,
        'totalPages': total_pages,
        'currentPage': page,
        'stats': stats
    })

@file_manager_bp.route('/files/<path:file_id>', methods=['DELETE'])
@admin_required
def delete_file(file_id):
    try:
        # Verificar se é um ID válido do banco de dados ou um ID negativo (arquivo físico sem registro)
        if file_id == '-1':
            # Para arquivos físicos sem registro no banco, precisamos do nome do arquivo
            filename = request.args.get('filename')
            if not filename:
                return jsonify({'success': False, 'message': 'Nome do arquivo é obrigatório para arquivos não registrados'}), 400
            
            # Verificar se o arquivo existe fisicamente
            file_path = os.path.join('static/uploads', filename)
            if not os.path.exists(file_path):
                return jsonify({'success': False, 'message': 'Arquivo não encontrado no sistema de arquivos'}), 404
            
            # Verificar se o arquivo está sendo usado
            # Obter todas as imagens de curso em uso
            course_images = {course.image for course in Course.query.filter(Course.image.isnot(None)).all()}
            # Obter todas as imagens de módulo em uso
            module_images = {module.image for module in Module.query.filter(Module.image.isnot(None)).all()}
            # Obter entradas de vitrine e promoções
            showcase_entries = Showcase.query.filter(Showcase.image.isnot(None)).all()
            promo_entries = Promotion.query.filter(Promotion.media_type=='image').all()
            
            # Verificar se está em uso
            is_used = False
            if filename in course_images or filename in module_images:
                is_used = True
            
            for item in showcase_entries:
                if item.image == filename:
                    is_used = True
                    break
                    
            for promo in promo_entries:
                if promo.media_url == filename:
                    is_used = True
                    break
            
            # Verificar se é uma capa de curso
            cover_match = re.match(r'^cover_(\d+)\.jpg$', filename)
            if cover_match:
                course_id = int(cover_match.group(1))
                if Course.query.get(course_id):
                    is_used = True
            
            if is_used:
                return jsonify({'success': False, 'message': 'Arquivo está sendo usado e não pode ser excluído'}), 400
            
            # Remover arquivo físico
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Arquivo excluído com sucesso'})
        else:
            # Para arquivos com ID no banco de dados
            document = Document.query.get_or_404(file_id)
            
            # Remover arquivo físico
            file_path = os.path.join('static/uploads', document.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Remover registro do banco
            db.session.delete(document)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Arquivo excluído com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@file_manager_bp.route('/upload_cover', methods=['POST'])
@admin_required
def upload_cover():
    course_id = request.form.get('course_id')
    file_desktop = request.files.get('file')
    file_mobile = request.files.get('file_mobile')
    if not file_desktop and not file_mobile:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
    saved = False
    if file_desktop and file_desktop.filename:
        ensure_upload_directory()
        filename = secure_filename(f"cover_{course_id}.jpg")
        file_desktop.save(os.path.join('static/uploads', filename))
        saved = True
    if file_mobile and file_mobile.filename:
        ensure_upload_directory()
        filename_mobile = secure_filename(f"cover_{course_id}_mobile.jpg")
        file_mobile.save(os.path.join('static/uploads', filename_mobile))
        saved = True
    if saved:
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Upload falhou'})

@file_manager_bp.route('/cover', methods=['DELETE'])
@admin_required
def delete_cover():
    course_id = request.args.get('course_id')
    if not course_id:
        return jsonify({'success': False, 'message': 'ID do curso não fornecido'}), 400
    
    filename = f"cover_{course_id}.jpg"
    file_path = os.path.join('static/uploads', filename)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Arquivo não encontrado'}), 404
