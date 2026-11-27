"""
Lesson thumbnail extraction service.

For Cloudflare R2 videos: uses cv2 to grab 1 frame at ~5 seconds,
converts to RGB via PIL, saves as compressed WebP in static/uploads/.

For YouTube lessons: derives thumbnail URL from the video ID (no local file).

Naming convention: lesson_thumb_{lesson_id}_compress.webp
Served at:         /static/uploads/lesson_thumb_{lesson_id}_compress.webp

Why cv2 and not ffmpeg subprocess?
  - cv2 (OpenCV) is already a Python library — no system binary needed.
  - VideoCapture on a remote URL uses FFmpeg's HTTP demuxer internally,
    which issues byte-range requests. For a well-formed MP4 with a front-loaded
    moov atom, only ~1-5 MB of data is fetched (the moov + 1st GOP).
  - Decoding a single frame: ~50-150 ms CPU.
  - imencode('.jpg'): ~5-10 ms CPU.
  - PIL WebP encode: ~5-10 ms CPU.
  - Total extra cost per upload: ~200-400 ms — invisible next to the
    multi-MB upload that already took seconds/minutes.
"""
import io
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

logger = logging.getLogger("services.lesson_thumbnail")

# Bounded pool so queued/bulk uploads never spawn dozens of concurrent cv2 decoders
_THUMBNAIL_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="r2-thumb")

UPLOADS_DIR = "static/uploads"
THUMBNAIL_MAX_WIDTH = 640   # thumbnail doesn't need full 1280px
THUMBNAIL_QUALITY = 72       # slightly lower than images — plenty for 160×90 previews
SEEK_SECONDS = 5             # grab frame at this position in the video


# ─── YouTube ─────────────────────────────────────────────────────────────────

_YT_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})"),
]


def youtube_thumbnail_url(video_url: str) -> Optional[str]:
    """
    Derive the YouTube thumbnail URL from a video URL or bare video ID.
    Returns mqdefault.jpg URL (320×180, always available) or None.
    """
    if not video_url:
        return None
    for pat in _YT_PATTERNS:
        m = pat.search(video_url)
        if m:
            return f"https://img.youtube.com/vi/{m.group(1)}/mqdefault.jpg"
    # Bare 11-char video ID
    bare = video_url.strip()
    if re.match(r"^[a-zA-Z0-9_-]{11}$", bare):
        return f"https://img.youtube.com/vi/{bare}/mqdefault.jpg"
    return None


# ─── R2 / Cloudflare video frame extraction ───────────────────────────────────

def extract_r2_thumbnail(video_url: str, lesson_id: int) -> Optional[str]:
    """
    Capture one frame from a remote video URL (R2), save as compressed WebP
    in static/uploads, and return the relative web path.

    Returns '/static/uploads/lesson_thumb_{lesson_id}_compress.webp' on success,
    or None on failure (non-fatal — lesson still works without a thumbnail).
    """
    try:
        import cv2
    except ImportError:
        logger.warning("cv2 not installed — skipping R2 thumbnail extraction. Run: pip install opencv-python-headless")
        return None

    try:
        from PIL import Image
    except ImportError:
        logger.warning("Pillow not installed — skipping R2 thumbnail extraction.")
        return None

    os.makedirs(UPLOADS_DIR, exist_ok=True)

    out_filename = f"lesson_thumb_{lesson_id}_compress.webp"
    out_path = os.path.join(UPLOADS_DIR, out_filename)

    logger.info("Extracting thumbnail for lesson %s from %s", lesson_id, video_url)

    cap = None
    try:
        cap = cv2.VideoCapture(video_url)
        if not cap.isOpened():
            logger.warning("cv2 could not open video URL for lesson %s", lesson_id)
            return None

        # Seek to SEEK_SECONDS — only fetches bytes up to that keyframe
        cap.set(cv2.CAP_PROP_POS_MSEC, SEEK_SECONDS * 1000)
        ret, frame = cap.read()

        if not ret or frame is None:
            # Fallback: try frame 0 if seek failed (very short video)
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()

        if not ret or frame is None:
            logger.warning("cv2 could not read any frame for lesson %s", lesson_id)
            return None

        # cv2 returns BGR — convert to RGB for PIL
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb)

        # Resize to thumbnail size (keep aspect ratio)
        w, h = img.size
        if w > THUMBNAIL_MAX_WIDTH:
            ratio = THUMBNAIL_MAX_WIDTH / w
            img = img.resize((THUMBNAIL_MAX_WIDTH, int(h * ratio)), Image.LANCZOS)

        img.save(
            out_path,
            format="WEBP",
            quality=THUMBNAIL_QUALITY,
            method=4,
            optimize=True,
        )

        logger.info("Thumbnail saved: %s", out_path)
        return f"/static/uploads/{out_filename}"

    except Exception as exc:
        logger.error("Failed to extract thumbnail for lesson %s: %s", lesson_id, exc)
        # Clean up partial file
        if os.path.exists(out_path):
            try:
                os.remove(out_path)
            except Exception:
                pass
        return None

    finally:
        if cap is not None:
            cap.release()


def extract_r2_thumbnail_background(
    app,
    lesson_id: int,
    video_url: str,
    course_id: int,
    module_id: int,
) -> None:
    """Schedule R2 thumbnail extraction in a bounded background thread pool.

    Prevents HTTP requests (create_lesson / update_lesson) from blocking on
    remote video demuxing/decoding and avoids 504 Gateway Timeouts.
    """
    if not video_url:
        return

    def _worker():
        with app.app_context():
            from db.database import db
            from models import Lesson
            from cache import invalidate_lesson

            try:
                thumb_path = extract_r2_thumbnail(video_url, lesson_id)
                if thumb_path:
                    lesson = Lesson.query.get(lesson_id)
                    if lesson and lesson.video_url == video_url:
                        lesson.thumbnail_url = thumb_path
                        db.session.commit()
                        invalidate_lesson(course_id, module_id)
            except Exception as exc:
                logger.error(
                    "Background thumbnail extraction failed for lesson %s: %s",
                    lesson_id,
                    exc,
                )
                try:
                    db.session.rollback()
                except Exception:
                    pass

    _THUMBNAIL_EXECUTOR.submit(_worker)


def save_uploaded_thumbnail(file_storage, lesson_id: int) -> Optional[str]:
    """Save a client-extracted thumbnail image as compressed WebP in static/uploads.

    Returns '/static/uploads/lesson_thumb_{lesson_id}_compress.webp' on success,
    or None if the file is missing/invalid.
    """
    if not file_storage or not getattr(file_storage, "filename", ""):
        return None

    os.makedirs(UPLOADS_DIR, exist_ok=True)
    out_filename = f"lesson_thumb_{lesson_id}_compress.webp"
    out_path = os.path.join(UPLOADS_DIR, out_filename)

    try:
        from PIL import Image

        img = Image.open(file_storage.stream).convert("RGB")
        w, h = img.size
        if w > THUMBNAIL_MAX_WIDTH:
            ratio = THUMBNAIL_MAX_WIDTH / w
            img = img.resize((THUMBNAIL_MAX_WIDTH, int(h * ratio)), Image.LANCZOS)

        img.save(
            out_path,
            format="WEBP",
            quality=THUMBNAIL_QUALITY,
            method=4,
            optimize=True,
        )
        logger.info("Client-generated thumbnail saved: %s", out_path)
        return f"/static/uploads/{out_filename}"
    except Exception as exc:
        logger.warning("Failed to save uploaded thumbnail for lesson %s: %s", lesson_id, exc)
        return None
