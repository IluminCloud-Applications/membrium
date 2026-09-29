from flask import Blueprint, Response
from datetime import datetime
import logging
from db.database import db
from models import StudentEmailAccessTracker

logger = logging.getLogger(__name__)

tracking_bp = Blueprint('tracking', __name__)

# 1x1 transparent GIF bytes (43 bytes)
PIXEL_GIF = (
    b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
    b'\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00'
    b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
)


@tracking_bp.route('/api/track/email-open/<token>', methods=['GET'])
def track_email_open(token):
    """
    Tracking pixel público:
    Chamado pelo cliente de e-mail (Gmail, Outlook, etc.) ao renderizar a imagem.
    Marca o e-mail de acesso como aberto e retorna um GIF 1x1 transparente sem cache.
    """
    try:
        tracker = StudentEmailAccessTracker.query.filter_by(tracking_token=token).first()
        if tracker:
            if not tracker.opened_at:
                tracker.opened_at = datetime.utcnow()
                tracker.status = 'opened'
                db.session.commit()
                logger.info(f"[Email Tracking] E-mail de acesso aberto com sucesso por {tracker.email} (token: {token})")
    except Exception as e:
        logger.error(f"[Email Tracking] Erro ao registrar abertura de email (token: {token}): {e}")
        try:
            db.session.rollback()
        except Exception:
            pass

    response = Response(PIXEL_GIF, mimetype='image/gif')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response
