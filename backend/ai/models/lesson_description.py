"""
LessonDescriptionAI — Geração de descrição curta de aula com IA.

Gera uma descrição de ~500 caracteres no estilo "Nesse vídeo você vai..."
baseada na transcrição da aula.
"""

import logging
from langchain_core.output_parsers import StrOutputParser

from ai.core.config import get_llm
from ai.core.prompts import LESSON_DESCRIPTION_PROMPT

logger = logging.getLogger("ai.models.lesson_description")

MAX_DESCRIPTION_CHARS = 500


class LessonDescriptionAI:
    """Geração de descrição curta de aula com IA."""

    @staticmethod
    def generate_description(
        transcript_text: str,
        lesson_title: str,
        module_name: str,
        course_name: str,
        provider: str,
        api_key: str,
        model: str | None = None,
    ) -> str:
        """
        Gera uma descrição curta (≤500 chars) para uma aula.

        Args:
            transcript_text: Texto da transcrição
            lesson_title: Título da aula
            module_name: Nome do módulo
            course_name: Nome do curso
            provider: 'gemini' ou 'openai'
            api_key: Chave da API
            model: Modelo a usar

        Returns:
            String com a descrição da aula

        Raises:
            ValueError: Se a transcrição estiver vazia
            RuntimeError: Se a IA falhar
        """
        if not transcript_text or not transcript_text.strip():
            raise ValueError("Transcrição vazia. Não é possível gerar descrição.")

        try:
            llm = get_llm(provider, api_key, model, temperature=0.4)
            parser = StrOutputParser()

            chain = LESSON_DESCRIPTION_PROMPT | llm | parser

            raw = chain.invoke({
                "lesson_title": lesson_title,
                "module_name": module_name,
                "course_name": course_name,
                "transcript_text": transcript_text[:3000],
            })

            description = raw.strip()

            # Garantir limite de 500 caracteres
            if len(description) > MAX_DESCRIPTION_CHARS:
                description = description[:MAX_DESCRIPTION_CHARS].rstrip()
                # Não cortar no meio de uma palavra
                last_space = description.rfind(" ")
                if last_space > 400:
                    description = description[:last_space]

            logger.info(
                f"Descrição gerada ({len(description)} chars) para '{lesson_title}'"
            )
            return description

        except (ValueError, RuntimeError):
            raise
        except Exception as e:
            logger.error(f"Erro ao gerar descrição: {str(e)}")
            raise RuntimeError(f"Erro ao gerar descrição da aula: {str(e)}")
