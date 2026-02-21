"""
Transcripts AI Routes — Geração de metadados com IA.

Endpoints:
- POST /api/transcripts/generate-metadata → Gera keywords e resumo
"""

import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps

from models import Admin, Settings
from ai.models.transcript_metadata import TranscriptMetadataAI

logger = logging.getLogger("routes.transcripts.ai")

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
    """Gera metadados (keywords e resumo) de uma transcrição usando IA."""
    try:
        data = request.get_json()
        transcript_text = data.get('text', '')
        provider = data.get('provider', 'gemini')

        if not transcript_text:
            return jsonify({
                'success': False,
                'message': 'Texto da transcrição não fornecido'
            }), 400

        # Obter API key
        settings = Settings.query.first()
        if not settings:
            return jsonify({'success': False, 'message': 'Configurações não encontradas'}), 404

        api_key = None
        if provider == 'gemini' and settings.gemini_api_enabled:
            api_key = settings.gemini_api_key
        elif provider == 'openai' and settings.openai_api_enabled:
            api_key = settings.openai_api

        if not api_key:
            return jsonify({
                'success': False,
                'message': f'API do {provider} não está configurada'
            }), 400

        result = TranscriptMetadataAI.generate_metadata(
            transcript_text=transcript_text,
            provider=provider,
            api_key=api_key,
        )

        return jsonify({
            'success': True,
            'keywords': result.get('keywords', ''),
            'summary': result.get('summary', ''),
        })

    except Exception as e:
        logger.error(f"Erro ao gerar metadados: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
