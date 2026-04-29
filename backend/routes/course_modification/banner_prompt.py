import logging
from flask import Blueprint, request, jsonify, session
from functools import wraps

from models import Admin
from db.integration_helpers import get_ai_api_key
from ai.models.banner_prompt import BannerPromptAI

logger = logging.getLogger("routes.course_modification.banner_prompt")

banner_prompt_bp = Blueprint("course_mod_banner_prompt", __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session or session.get("user_type") != "admin":
            return jsonify({"error": "Unauthorized"}), 401
        if not Admin.query.get(session["user_id"]):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


@banner_prompt_bp.route("/banner-prompt", methods=["POST"])
@admin_required
def generate_banner_prompt():
    """
    Gera prompts de banner via IA (stateless — não requer módulo salvo).

    Body JSON:
      - module_name: Nome do módulo (obrigatório)
      - module_description: Descrição sobre o módulo (obrigatório)
      - course_name: Nome do curso (opcional)
      - provider: 'gemini' (padrão) ou 'openai'
      - model: Nome do modelo (opcional)
    """
    data = request.get_json() or {}
    module_name = (data.get("module_name") or "").strip()
    module_description = (data.get("module_description") or "").strip()
    course_name = (data.get("course_name") or "Curso").strip()
    provider = data.get("provider", "gemini")
    model = data.get("model")

    if not module_name:
        return jsonify({"success": False, "message": "Nome do módulo é obrigatório."}), 400
    if not module_description:
        return jsonify({"success": False, "message": "Descrição do módulo é obrigatória."}), 400

    api_key = get_ai_api_key(provider)
    if not api_key:
        return jsonify({
            "success": False,
            "message": f"API do {provider} não está configurada. Configure em Configurações → IA.",
        }), 400

    try:
        result = BannerPromptAI.generate(
            module_name=module_name,
            module_description=module_description,
            course_name=course_name,
            provider=provider,
            api_key=api_key,
            model=model,
        )
        return jsonify({"success": True, "prompts": result})

    except RuntimeError as e:
        return jsonify({"success": False, "message": str(e)}), 500
    except Exception as e:
        logger.error(f"Erro inesperado ao gerar banner prompt: {e}")
        return jsonify({"success": False, "message": "Erro inesperado. Tente novamente."}), 500
