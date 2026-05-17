"""
Shared helpers for file manager routes.
"""
import os
from models import Course, Module, Document, Showcase, Promotion, Customization, Lesson


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

    # Login page customization — schema:
    #   login_page.logo                        -> logo image
    #   login_page.desktop.background_image   -> desktop bg
    #   login_page.mobile.background_image    -> mobile bg
    login_images = set()
    for custom in Customization.query.all():
        lp = custom.login_page or {}
        if lp.get('logo'):
            login_images.add(lp['logo'])
        desktop = lp.get('desktop') or {}
        if desktop.get('background_image'):
            login_images.add(desktop['background_image'])
        mobile = lp.get('mobile') or {}
        if mobile.get('background_image'):
            login_images.add(mobile['background_image'])

    # Lesson thumbnails
    lessons = Lesson.query.filter(Lesson.thumbnail_url.isnot(None)).all()
    lesson_thumbnails = set()
    for l in lessons:
        url = l.thumbnail_url
        if url and url.startswith('/static/uploads/'):
            filename = url.replace('/static/uploads/', '')
            lesson_thumbnails.add(filename)

    return {
        'course_images': course_images,
        'course_covers_desktop': course_covers_desktop,
        'course_covers_mobile': course_covers_mobile,
        'module_images': module_images,
        'db_filenames': db_filenames,
        'showcase_images': showcase_images,
        'promo_images': promo_images,
        'login_images': login_images,
        'lesson_thumbnails': lesson_thumbnails,
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

    if filename in refs['login_images']:
        is_used = True
        used_in.append('Fundo da página de login')

    if filename in refs.get('lesson_thumbnails', set()):
        is_used = True
        used_in.append('Thumbnail de aula')

    return is_used, used_in


UPLOADS_DIR = os.path.join('static', 'uploads')
