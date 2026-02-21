"""
FaqAI — Geração de FAQs com IA baseado em transcrições de aulas.

Fluxo:
1. Obtém transcrição da aula (do banco ou gerando via YouTube)
2. Usa LLM para gerar perguntas e respostas
3. Retorna FAQs formatadas para o frontend
"""

import json
import logging
from langchain_core.output_parsers import StrOutputParser

from ai.core.config import get_llm
from ai.core.prompts import FAQ_GENERATION_PROMPT

logger = logging.getLogger("ai.models.faq")

DEFAULT_NUM_QUESTIONS = 5


class FaqAI:
    """Classe para geração automática de FAQs com IA."""

    @staticmethod
    def generate_faqs(
        transcript_text: str,
        lesson_title: str,
        module_name: str,
        course_name: str,
        provider: str,
        api_key: str,
        model: str,
        num_questions: int = DEFAULT_NUM_QUESTIONS,
    ) -> list[dict]:
        """
        Gera FAQs a partir de uma transcrição de aula.
        
        Args:
            transcript_text: Texto da transcrição da aula
            lesson_title: Título da aula
            module_name: Nome do módulo
            course_name: Nome do curso
            provider: 'gemini' ou 'openai'
            api_key: Chave API do provider
            model: Nome do modelo
            num_questions: Número de perguntas a gerar
        
        Returns:
            Lista de dicts com 'question' e 'answer'
        
        Raises:
            ValueError: Se a transcrição estiver vazia
            RuntimeError: Se não conseguir gerar FAQs válidas
        """
        if not transcript_text or not transcript_text.strip():
            raise ValueError("Transcrição vazia. Não é possível gerar FAQ.")

        try:
            llm = get_llm(provider, api_key, model, temperature=0.5)
            parser = StrOutputParser()
            
            chain = FAQ_GENERATION_PROMPT | llm | parser
            
            # Limitar transcrição para economizar tokens
            truncated_text = transcript_text[:4000]
            
            raw_response = chain.invoke({
                "num_questions": num_questions,
                "lesson_title": lesson_title,
                "module_name": module_name,
                "course_name": course_name,
                "transcript_text": truncated_text,
            })
            
            faqs = FaqAI._parse_faq_response(raw_response)
            logger.info(f"FAQ gerado com sucesso: {len(faqs)} perguntas para '{lesson_title}'")
            return faqs
            
        except (ValueError, RuntimeError):
            raise
        except Exception as e:
            logger.error(f"Erro ao gerar FAQ: {str(e)}")
            raise RuntimeError(f"Erro ao gerar FAQ com IA: {str(e)}")

    @staticmethod
    def _parse_faq_response(raw_response: str) -> list[dict]:
        """Faz parse da resposta da IA e retorna lista de FAQs."""
        # Limpar resposta — remover possíveis blocos markdown
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Erro ao fazer parse do JSON: {e}\nResposta: {raw_response[:500]}")
            raise RuntimeError("IA retornou resposta inválida. Tente novamente.")
        
        if not isinstance(parsed, list):
            raise RuntimeError("IA retornou formato inválido. Esperava uma lista de FAQs.")
        
        faqs = []
        for item in parsed:
            if isinstance(item, dict) and "question" in item and "answer" in item:
                faqs.append({
                    "question": item["question"].strip(),
                    "answer": item["answer"].strip(),
                })
        
        if not faqs:
            raise RuntimeError("Nenhuma FAQ válida foi gerada. Tente novamente.")
        
        return faqs
