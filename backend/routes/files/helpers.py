"""
Shared helpers for file manager routes.
"""
import os
from models import Course, Module, Document, Showcase, Promotion


def get_referenced_filenames():
    """
    Gather all filenames referenced across the system.
    Returns a dict with sets for each category.
    """
    courses = Course.query.all()

    course_images = {c.image for c in courses if c.image}
    course_covers_desktop = {c.cover_desktop for c in courses if c.cover_desktop}
    course_covers_mobile = {c.cover_mobile for c in courses if c.cover_mobile}
    module_images = {m.image for m in Module.query.filter(Module.image.isnot(None)).all()}
    db_filenames = {d.filename: d for d in Document.query.all()}
    showcase_images = {s.image for s in Showcase.query.filter(Showcase.image.isnot(None)).all()}
    promo_images = {p.media_url for p in Promotion.query.filter(Promotion.media_type == 'image').all()}

    return {
        'course_images': course_images,
        'course_covers_desktop': course_covers_desktop,
        'course_covers_mobile': course_covers_mobile,
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

    if filename in refs['course_images']:
        is_used = True
        used_in.append('Imagem de curso')

    if filename in refs['course_covers_desktop']:
        is_used = True
        used_in.append('Capa desktop de curso')

    if filename in refs['course_covers_mobile']:
        is_used = True
        used_in.append('Capa mobile de curso')

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

