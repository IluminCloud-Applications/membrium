"""
Chatbot Chat Routes — Endpoint de interação do chatbot.

Endpoints:
- POST /api/chatbot/chat       → Enviar mensagem e receber resposta (aluno)
- POST /api/chatbot/clear      → Limpar histórico (aluno)
- POST /api/chatbot/test       → Testar chatbot como admin
- POST /api/chatbot/test/clear → Limpar histórico de teste (admin)
"""

import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps
from sqlalchemy import text

from models import Admin, Settings, LessonTranscript
from db.database import db
from ai.models.chatbot import ChatbotAI

logger = logging.getLogger("routes.chatbot.chat")

chat_bp = Blueprint('chatbot_chat', __name__)


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_type' not in session or session['user_type'] != 'student':
            return jsonify({"error": "Acesso não autorizado."}), 403
        return f(*args, **kwargs)
    return decorated_function


@chat_bp.route('/chat', methods=['POST'])
@student_required
def chat_with_bot():
    """Endpoint principal para interação com o chatbot."""
    data = request.json
    query = data.get('message')
    student_id = session.get('user_id')
    
    if not query:
        return jsonify({"error": "Mensagem não fornecida"}), 400
    
    settings = Settings.query.first()
    if not settings or not settings.chatbot_enabled:
        return jsonify({"error": "Chatbot não está configurado ou ativado"}), 400
    
    # Verificar provider e API key
    provider = settings.chatbot_provider
    api_key = _get_api_key(settings, provider)
    if not api_key:
        return jsonify({"error": f"{provider} não está configurada"}), 400
    
    # Buscar transcrições relevantes (se não for casual ou se o conhecimento interno está desativado)
    relevant_transcripts = None
    if not ChatbotAI.is_casual_message(query) or not settings.chatbot_use_internal_knowledge:
        relevant_transcripts = _search_relevant_lessons(query)
    
    # Gerar resposta
    base_url = request.url_root.rstrip('/')
    response = ChatbotAI.generate_response(
        question=query,
        student_id=student_id,
        provider=provider,
        api_key=api_key,
        model=settings.chatbot_model,
        use_internal_knowledge=settings.chatbot_use_internal_knowledge,
        relevant_transcripts=relevant_transcripts,
        base_url=base_url,
    )
    
    return jsonify({"response": response})


@chat_bp.route('/clear', methods=['POST'])
@student_required
def clear_chat_history():
    """Limpa o histórico de conversa do aluno."""
    student_id = session.get('user_id')
    ChatbotAI.clear_history(student_id)
    return jsonify({"success": True, "message": "Histórico limpo."})


# ─── Admin Test Endpoints ─────────────────────────────────────────

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({"error": "Acesso não autorizado."}), 403
        if not Admin.query.get(session['user_id']):
            return jsonify({"error": "Acesso não autorizado."}), 403
        return f(*args, **kwargs)
    return decorated_function


@chat_bp.route('/test', methods=['POST'])
@admin_required
def test_chatbot():
    """Endpoint para o admin testar o chatbot como se fosse aluno."""
    data = request.json
    query = data.get('message')
    admin_id = session.get('user_id')

    if not query:
        return jsonify({"error": "Mensagem não fornecida"}), 400

    settings = Settings.query.first()
    if not settings:
        return jsonify({"error": "Configurações não encontradas"}), 400

    # Verificar provider e API key
    provider = settings.chatbot_provider
    api_key = _get_api_key(settings, provider)
    if not api_key:
        return jsonify({"error": f"{provider} não está configurada"}), 400

    # Usar ID negativo para separar histórico de teste do de alunos reais
    test_student_id = -(admin_id)

    # Buscar transcrições relevantes
    relevant_transcripts = None
    if not ChatbotAI.is_casual_message(query) or not settings.chatbot_use_internal_knowledge:
        relevant_transcripts = _search_relevant_lessons(query)

    base_url = request.url_root.rstrip('/')
    response = ChatbotAI.generate_response(
        question=query,
        student_id=test_student_id,
        provider=provider,
        api_key=api_key,
        model=settings.chatbot_model,
        use_internal_knowledge=settings.chatbot_use_internal_knowledge,
        relevant_transcripts=relevant_transcripts,
        base_url=base_url,
    )

    return jsonify({"response": response})


@chat_bp.route('/test/clear', methods=['POST'])
@admin_required
def clear_test_history():
    """Limpa o histórico de teste do admin."""
    admin_id = session.get('user_id')
    ChatbotAI.clear_history(-(admin_id))
    return jsonify({"success": True, "message": "Histórico de teste limpo."})


def _get_api_key(settings: Settings, provider: str) -> str | None:
    """Retorna a API key do provider configurado."""
    if provider == 'openai' and settings.openai_api_enabled:
        return settings.openai_api
    if provider == 'gemini' and settings.gemini_api_enabled:
        return settings.gemini_api_key
    return None


def _search_relevant_lessons(query: str, limit: int = 3) -> list:
    """Busca lições relevantes para a consulta usando busca textual."""
    like_query = f"%{query}%"
    query_words = [w.strip() for w in query.lower().split() if len(w.strip()) > 3]
    
    if not query_words:
        return []
    
    # Busca por palavras-chave + vetores + títulos
    word_conditions = []
    for word in query_words:
        word_conditions.append(f"searchable_keywords ILIKE '%{word}%'")
        word_conditions.append(f"transcript_vector ILIKE '%{word}%'")
    
    search_sql = text(f"""
        SELECT DISTINCT lt.id,
            CASE 
                WHEN lt.searchable_keywords ILIKE :like_query THEN 4
                WHEN lt.transcript_vector ILIKE :like_query THEN 3
                WHEN lt.lesson_title ILIKE :like_query THEN 2
                WHEN lt.module_name ILIKE :like_query THEN 1.5
                WHEN lt.transcript_text ILIKE :like_query THEN 1
                ELSE 0.5
            END AS relevance_score
        FROM lesson_transcript lt
        WHERE lt.searchable_keywords ILIKE :like_query
        OR lt.lesson_title ILIKE :like_query
        OR lt.module_name ILIKE :like_query
        OR lt.course_name ILIKE :like_query
        OR lt.transcript_text ILIKE :like_query
        OR ({" OR ".join(word_conditions)})
        ORDER BY relevance_score DESC
        LIMIT :limit
    """)
    
    results = db.session.execute(
        search_sql,
        {"like_query": like_query, "limit": limit}
    ).fetchall()
    
    transcript_ids = [row.id for row in results]
    if not transcript_ids:
        return []
    
    return LessonTranscript.query.filter(LessonTranscript.id.in_(transcript_ids)).all()
