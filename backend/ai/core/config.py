"""
AI Core Config — Factory para criar LLMs via Langchain.

Suporta:
- Google Gemini (via langchain_google_genai)
- OpenAI (via langchain_openai)
"""

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

logger = logging.getLogger("ai.core.config")

# Modelos padrão para cada provider
DEFAULT_MODELS = {
    "gemini": "gemini-2.0-flash",
    "openai": "gpt-4o-mini",
}


def get_llm(provider: str, api_key: str, model: str | None = None, temperature: float = 0.7):
    """
    Factory que retorna uma instância de LLM do Langchain.
    
    Args:
        provider: 'gemini' ou 'openai'
        api_key: Chave da API do provider
        model: Nome do modelo (usa padrão se não fornecido)
        temperature: Temperatura para geração (0.0 a 1.0)
    
    Returns:
        Instância de ChatModel do Langchain
    
    Raises:
        ValueError: Se o provider não for suportado
    """
    model_name = model or DEFAULT_MODELS.get(provider)
    
    if provider == "gemini":
        logger.info(f"Inicializando Gemini com modelo: {model_name}")
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=temperature,
            max_retries=2,
        )
    
    if provider == "openai":
        logger.info(f"Inicializando OpenAI com modelo: {model_name}")
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            max_retries=2,
        )
    
    raise ValueError(f"Provider não suportado: {provider}. Use 'gemini' ou 'openai'.")
