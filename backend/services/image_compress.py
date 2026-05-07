"""
Image compression service.

Converts any image to WebP with:
  - Quality: 75
  - Max width: 1280px (preserves aspect ratio)
  - Compression method: 4 (fast + efficient)

Naming convention: {original_stem}_compress.webp
The original file is removed after successful compression.
"""
import logging
import os
from pathlib import Path
from typing import Optional

from PIL import Image

logger = logging.getLogger("services.image_compress")

WEBP_QUALITY = 75
WEBP_METHOD = 4
MAX_WIDTH = 1280
COMPRESS_SUFFIX = "_compress"


def is_compressed(filename: str) -> bool:
    """Returns True if the file was already processed by this service."""
    stem = Path(filename).stem
    return stem.endswith(COMPRESS_SUFFIX)


def is_image(filename: str) -> bool:
    """Returns True if the file extension looks like a raster image."""
    return Path(filename).suffix.lower() in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"}


def compressed_filename(original_filename: str) -> str:
    """
    Build the output filename for a compressed version.

    Example:
        cover_1.jpg  ->  cover_1_compress.webp
        banner.png   ->  banner_compress.webp
    """
    stem = Path(original_filename).stem
    return f"{stem}{COMPRESS_SUFFIX}.webp"


def compress_image(src_path: str, uploads_dir: str) -> tuple[bool, str, Optional[str]]:
    """
    Compress a single image file.

    Returns (success, message, new_filename | None).
    The original file is deleted on success.
    """
    filename = os.path.basename(src_path)

    if not os.path.isfile(src_path):
        return False, f"Arquivo não encontrado: {filename}", None

    if not is_image(filename):
        return False, f"Arquivo não é uma imagem suportada: {filename}", None

    if is_compressed(filename):
        return False, f"Imagem já está comprimida: {filename}", None

    out_filename = compressed_filename(filename)
    out_path = os.path.join(uploads_dir, out_filename)

    try:
        with Image.open(src_path) as img:
            # Convert to RGB so WebP encoder never complains about RGBA/palette
            img = img.convert("RGB")

            # Resize if wider than MAX_WIDTH (keep aspect ratio)
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)

            img.save(
                out_path,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=WEBP_METHOD,
                optimize=True,
            )

        os.remove(src_path)
        logger.info("Compressed %s -> %s", filename, out_filename)
        return True, f"Comprimido com sucesso: {out_filename}", out_filename

    except Exception as exc:
        logger.error("Failed to compress %s: %s", filename, exc)
        # Clean up partial output if it exists
        if os.path.exists(out_path):
            try:
                os.remove(out_path)
            except Exception:
                pass
        return False, f"Erro ao comprimir {filename}: {exc}", None
