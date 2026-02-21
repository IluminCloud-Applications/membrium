from flask import Blueprint, request, jsonify, session
from functools import wraps
from models import Admin
import logging

logger = logging.getLogger("transcripts.ai")

ai_bp = Blueprint('transcripts_ai', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


@ai_bp.route('/generate-metadata', methods=['POST'])
@admin_required
def generate_metadata():
    """Generate transcript metadata (vector and keywords) using AI.
    
    TODO: Implement AI generation when ready.
    """
    try:
        data = request.get_json()
        transcript_text = data.get('text', '')
        provider = data.get('provider', 'groq')

        if not transcript_text:
            return jsonify({
                'success': False,
                'message': 'Texto da transcrição não fornecido'
            }), 400

        # Placeholder — will be integrated with faq_ai.generate_transcript_metadata
        return jsonify({
            'success': False,
            'message': 'Geração de metadados com IA ainda não implementada.'
        }), 501

    except Exception as e:
        logger.error(f"Erro ao gerar metadados: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
