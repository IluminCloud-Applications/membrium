"""
Compress endpoint — processes one uncompressed image at a time,
updates all DB references, and removes the original file.

POST /api/files/compress-next
  -> { compressed: true, original, new_filename } | { compressed: false, done: true }

GET /api/files/compress-status
  -> { total: N, pending: N }
"""
import os
import re
from flask import Blueprint, jsonify, session
from functools import wraps

from db.database import db
from sqlalchemy.orm.attributes import flag_modified
from models import Admin, Course, Module, Showcase, Promotion, Customization
from routes.files.helpers import UPLOADS_DIR
from services.image_compress import compress_image, is_compressed, is_image

compress_bp = Blueprint("files_compress", __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session or session.get("user_type") != "admin":
            return jsonify({"error": "Unauthorized"}), 401
        if not Admin.query.get(session["user_id"]):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated_function


def _get_pending_images() -> list[str]:
    """Return image filenames (in uploads dir) that have not been compressed yet."""
    try:
        all_files = os.listdir(UPLOADS_DIR)
    except Exception:
        return []

    return [
        f for f in all_files
        if os.path.isfile(os.path.join(UPLOADS_DIR, f))
        and is_image(f)
        and not is_compressed(f)
    ]


def _update_db_references(original_filename: str, new_filename: str) -> None:
    """
    Replace every DB reference to original_filename with new_filename.
    Covers: Course.image, Course.cover_desktop, Course.cover_mobile,
            Module.image, Showcase.image, Promotion.media_url,
            Customization.login_page (bg_desktop / bg_mobile).
    """
    changed = False

    # --- Course ---
    for course in Course.query.filter(
        (Course.image == original_filename)
        | (Course.cover_desktop == original_filename)
        | (Course.cover_mobile == original_filename)
    ).all():
        if course.image == original_filename:
            course.image = new_filename
        if course.cover_desktop == original_filename:
            course.cover_desktop = new_filename
        if course.cover_mobile == original_filename:
            course.cover_mobile = new_filename
        changed = True

    # --- Module ---
    for module in Module.query.filter(Module.image == original_filename).all():
        module.image = new_filename
        changed = True

    # --- Showcase ---
    for showcase in Showcase.query.filter(Showcase.image == original_filename).all():
        showcase.image = new_filename
        changed = True

    # --- Promotion ---
    for promo in Promotion.query.filter(
        Promotion.media_type == "image",
        Promotion.media_url == original_filename,
    ).all():
        promo.media_url = new_filename
        changed = True

    # --- Customization (login_page JSON) ---
    # Schema: login_page.logo | login_page.desktop.background_image | login_page.mobile.background_image
    for custom in Customization.query.all():
        lp = custom.login_page or {}
        updated = False

        if lp.get("logo") == original_filename:
            lp["logo"] = new_filename
            updated = True

        desktop = lp.get("desktop") or {}
        if desktop.get("background_image") == original_filename:
            desktop["background_image"] = new_filename
            lp["desktop"] = desktop
            updated = True

        mobile = lp.get("mobile") or {}
        if mobile.get("background_image") == original_filename:
            mobile["background_image"] = new_filename
            lp["mobile"] = mobile
            updated = True

        if updated:
            custom.login_page = lp
            flag_modified(custom, "login_page")
            changed = True

    if changed:
        db.session.commit()


@compress_bp.route("/compress-status", methods=["GET"])
@admin_required
def compress_status():
    """Return total images and how many still need compression."""
    try:
        all_files = os.listdir(UPLOADS_DIR)
    except Exception:
        return jsonify({"total": 0, "pending": 0})

    images = [
        f for f in all_files
        if os.path.isfile(os.path.join(UPLOADS_DIR, f)) and is_image(f)
    ]
    pending = [f for f in images if not is_compressed(f)]

    return jsonify({"total": len(images), "pending": len(pending)})


@compress_bp.route("/compress-next", methods=["POST"])
@admin_required
def compress_next():
    """
    Compress the next pending image (one at a time).
    Returns { compressed: true, original, new_filename } or { compressed: false, done: true }.
    """
    pending = _get_pending_images()

    if not pending:
        return jsonify({"compressed": False, "done": True})

    filename = pending[0]
    src_path = os.path.join(UPLOADS_DIR, filename)

    success, message, new_filename = compress_image(src_path, UPLOADS_DIR)

    if not success:
        return jsonify({"compressed": False, "error": message}), 500

    # Update every DB table that might reference this file
    _update_db_references(filename, new_filename)

    return jsonify({
        "compressed": True,
        "original": filename,
        "new_filename": new_filename,
        "message": message,
    })
