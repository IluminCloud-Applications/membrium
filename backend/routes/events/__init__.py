from flask import Blueprint

events_bp = Blueprint('events', __name__, url_prefix='/api/admin/events')

from . import crud
