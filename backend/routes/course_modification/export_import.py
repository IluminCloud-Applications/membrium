from flask import Blueprint, jsonify, request, session, send_file
from functools import wraps
from datetime import datetime
from db.database import db
from db.utils import ensure_upload_directory
from models import Admin, Course, Module, Lesson, Document
import os
import json
import zipfile
import io
import logging

logger = logging.getLogger("routes.course_modification.export_import")

export_import_bp = Blueprint('course_export_import', __name__)

UPLOAD_DIR = 'static/uploads'


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def _serialize_course_for_export(course):
    """Serialize full course hierarchy for export."""
    return {
        'name': course.name,
        'description': course.description or '',
        'category': course.category or 'principal',
        'module_format': course.module_format or 'standard',
        'menu_items': course.menu_items or [],
        'cover_desktop': course.cover_desktop,
        'cover_mobile': course.cover_mobile,
        'image': course.image,
        'modules': [_serialize_module_for_export(m) for m in course.modules],
    }


def _serialize_module_for_export(module):
    """Serialize module with lessons for export."""
    return {
        'name': module.name,
        'order': module.order,
        'unlock_after_days': module.unlock_after_days or 0,
        'image': module.image,
        'lessons': [_serialize_lesson_for_export(l) for l in module.lessons],
    }


def _serialize_lesson_for_export(lesson):
    """Serialize lesson with documents for export."""
    return {
        'title': lesson.title,
        'description': lesson.description or '',
        'order': lesson.order,
        'video_url': lesson.video_url or '',
        'video_type': lesson.video_type or 'youtube',
        'has_button': lesson.has_button or False,
        'button_text': lesson.button_text or '',
        'button_link': lesson.button_link or '',
        'button_delay': lesson.button_delay or 0,
        'documents': [{'filename': doc.filename} for doc in lesson.documents],
    }


def _collect_asset_filenames(course_data):
    """Collect all asset filenames referenced in the course data."""
    filenames = []
    for field in ['cover_desktop', 'cover_mobile', 'image']:
        if course_data.get(field):
            filenames.append(course_data[field])
    for module in course_data.get('modules', []):
        if module.get('image'):
            filenames.append(module['image'])
        for lesson in module.get('lessons', []):
            for doc in lesson.get('documents', []):
                if doc.get('filename'):
                    filenames.append(doc['filename'])
    return filenames


def _generate_unique_filename(original):
    """Generate a unique filename to avoid collisions on import."""
    name, ext = os.path.splitext(original)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
    return f"imp_{timestamp}_{name}{ext}"


@export_import_bp.route('/<int:course_id>/export', methods=['GET'])
@admin_required
def export_course(course_id):
    """Export a course as a ZIP file containing JSON data + assets."""
    course = Course.query.get_or_404(course_id)
    course_data = _serialize_course_for_export(course)

    export_payload = {
        'version': '1.0',
        'exported_at': datetime.utcnow().isoformat(),
        'course': course_data,
    }

    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Write JSON data
        zf.writestr('course.json', json.dumps(export_payload, ensure_ascii=False, indent=2))

        # Write asset files
        asset_filenames = _collect_asset_filenames(course_data)
        for filename in asset_filenames:
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                zf.write(file_path, f'assets/{filename}')
            else:
                logger.warning(f"Asset not found, skipping: {file_path}")

    zip_buffer.seek(0)
    safe_name = course.name.replace(' ', '_').lower()[:30]
    download_name = f"curso_{safe_name}_{datetime.now().strftime('%Y%m%d')}.zip"

    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name=download_name,
    )


@export_import_bp.route('/import', methods=['POST'])
@admin_required
def import_course():
    """Import a course from a ZIP file."""
    file = request.files.get('file')
    if not file:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400

    try:
        zip_buffer = io.BytesIO(file.read())
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            # Read and parse course.json
            if 'course.json' not in zf.namelist():
                return jsonify({'success': False, 'message': 'Arquivo ZIP inválido: course.json não encontrado'}), 400

            course_json = json.loads(zf.read('course.json').decode('utf-8'))
            course_data = course_json.get('course')
            if not course_data:
                return jsonify({'success': False, 'message': 'Dados do curso não encontrados no JSON'}), 400

            # Map old filenames to new filenames
            filename_map = _extract_and_map_assets(zf, course_data)

            # Create course
            new_course = _create_course_from_data(course_data, filename_map)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Curso "{new_course.name}" importado com sucesso!',
            'course_id': new_course.id,
        })

    except zipfile.BadZipFile:
        return jsonify({'success': False, 'message': 'Arquivo ZIP corrompido ou inválido'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao importar curso: {e}")
        return jsonify({'success': False, 'message': f'Erro ao importar: {str(e)}'}), 500


def _extract_and_map_assets(zf, course_data):
    """Extract assets from ZIP and return a map of old_filename -> new_filename."""
    ensure_upload_directory()
    filename_map = {}
    asset_filenames = _collect_asset_filenames(course_data)

    for old_filename in asset_filenames:
        zip_path = f'assets/{old_filename}'
        if zip_path in zf.namelist():
            new_filename = _generate_unique_filename(old_filename)
            dest_path = os.path.join(UPLOAD_DIR, new_filename)
            with zf.open(zip_path) as src, open(dest_path, 'wb') as dst:
                dst.write(src.read())
            filename_map[old_filename] = new_filename
        else:
            logger.warning(f"Asset not in ZIP, skipping: {zip_path}")

    return filename_map


def _create_course_from_data(course_data, filename_map):
    """Create Course, Modules, Lessons, Documents from exported data."""
    new_course = Course(
        name=course_data['name'],
        description=course_data.get('description', ''),
        category=course_data.get('category', 'principal'),
        module_format=course_data.get('module_format', 'standard'),
        menu_items=course_data.get('menu_items', []),
        cover_desktop=filename_map.get(course_data.get('cover_desktop')),
        cover_mobile=filename_map.get(course_data.get('cover_mobile')),
        image=filename_map.get(course_data.get('image')),
        is_published=False,  # Import as unpublished for safety
    )
    db.session.add(new_course)
    db.session.flush()  # Get the course ID

    for mod_data in course_data.get('modules', []):
        _create_module_from_data(new_course, mod_data, filename_map)

    return new_course


def _create_module_from_data(course, mod_data, filename_map):
    """Create a module and its lessons from exported data."""
    new_module = Module(
        name=mod_data['name'],
        order=mod_data.get('order', 1),
        unlock_after_days=mod_data.get('unlock_after_days', 0),
        image=filename_map.get(mod_data.get('image')),
        course=course,
    )
    db.session.add(new_module)
    db.session.flush()

    for lesson_data in mod_data.get('lessons', []):
        _create_lesson_from_data(new_module, lesson_data, filename_map)


def _create_lesson_from_data(module, lesson_data, filename_map):
    """Create a lesson and its documents from exported data."""
    new_lesson = Lesson(
        title=lesson_data['title'],
        description=lesson_data.get('description', ''),
        order=lesson_data.get('order', 1),
        video_url=lesson_data.get('video_url', ''),
        video_type=lesson_data.get('video_type', 'youtube'),
        has_button=lesson_data.get('has_button', False),
        button_text=lesson_data.get('button_text', ''),
        button_link=lesson_data.get('button_link', ''),
        button_delay=lesson_data.get('button_delay', 0),
        module=module,
    )
    db.session.add(new_lesson)
    db.session.flush()

    for doc_data in lesson_data.get('documents', []):
        old_filename = doc_data.get('filename')
        new_filename = filename_map.get(old_filename)
        if new_filename:
            new_doc = Document(filename=new_filename, lesson=new_lesson)
            db.session.add(new_doc)
