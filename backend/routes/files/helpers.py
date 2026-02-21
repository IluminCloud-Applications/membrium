"""
Shared helpers for file manager routes.
"""
import re
import os
from models import Course, Module, Document, Showcase, Promotion


def get_referenced_filenames():
    """
    Gather all filenames referenced across the system.
    Returns a dict with sets for each category.
    """
    course_images = {c.image for c in Course.query.filter(Course.image.isnot(None)).all()}
    course_ids = {c.id for c in Course.query.all()}
    module_images = {m.image for m in Module.query.filter(Module.image.isnot(None)).all()}
    db_filenames = {d.filename: d for d in Document.query.all()}
    showcase_images = {s.image for s in Showcase.query.filter(Showcase.image.isnot(None)).all()}
    promo_images = {p.media_url for p in Promotion.query.filter(Promotion.media_type == 'image').all()}

    return {
        'course_images': course_images,
        'course_ids': course_ids,
        'module_images': module_images,
        'db_filenames': db_filenames,
        'showcase_images': showcase_images,
        'promo_images': promo_images,
    }


def check_file_usage(filename, refs):
    """
    Check if a file is being used and where.
    Returns (is_used: bool, used_in: list[str]).
    """
    is_used = False
    used_in = []

    # Cover image check
    cover_match = re.match(r'^cover_(\d+)\.jpg$', filename)
    if cover_match:
        course_id = int(cover_match.group(1))
        if course_id in refs['course_ids']:
            is_used = True
            used_in.append(f'Capa do curso ID {course_id}')

    # Mobile cover check
    cover_mobile_match = re.match(r'^cover_(\d+)_mobile\.jpg$', filename)
    if cover_mobile_match:
        course_id = int(cover_mobile_match.group(1))
        if course_id in refs['course_ids']:
            is_used = True
            used_in.append(f'Capa mobile do curso ID {course_id}')

    if filename in refs['course_images']:
        is_used = True
        used_in.append('Imagem de curso')

    if filename in refs['module_images']:
        is_used = True
        used_in.append('Imagem de módulo')

    if filename in refs['db_filenames']:
        is_used = True
        used_in.append('Documento de aula')

    if filename in refs['showcase_images']:
        is_used = True
        used_in.append('Imagem de vitrine')

    if filename in refs['promo_images']:
        is_used = True
        used_in.append('Imagem de promoção')

    return is_used, used_in


UPLOADS_DIR = os.path.join('static', 'uploads')
