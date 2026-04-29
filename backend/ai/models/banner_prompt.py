"""
BannerPromptAI — Geração de prompts para banners de módulo.

Gera prompts detalhados para ferramentas como Midjourney, DALL-E 3, Leonardo AI, etc.
Retorna JSON estruturado com dois prompts: com expert (pessoa) e sem expert.
"""

import json
import logging
from langchain_core.output_parsers import StrOutputParser

from ai.core.config import get_llm
from ai.core.prompts import BANNER_PROMPT_TEMPLATE

logger = logging.getLogger("ai.models.banner_prompt")


class BannerPromptAI:
    """Geração de prompts para banners de módulo de curso (9:16)."""

    @staticmethod
    def generate(
        module_name: str,
        module_description: str,
        course_name: str,
        provider: str,
        api_key: str,
        model: str | None = None,
    ) -> dict:
        """
        Gera dois prompts para banners verticais (9:16): com e sem expert.

        Returns:
            dict com keys: with_expert, without_expert (cada um é o JSON do prompt)

        Raises:
            RuntimeError: Se a IA falhar
        """
        try:
            llm = get_llm(provider, api_key, model, temperature=0.85)
            parser = StrOutputParser()
            chain = BANNER_PROMPT_TEMPLATE | llm | parser

            raw = chain.invoke({
                "module_name": module_name,
                "module_description": module_description,
                "course_name": course_name,
            })

            raw = raw.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                lines = raw.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                raw = "\n".join(lines).strip()

            result = json.loads(raw)
            logger.info(f"Banner prompts gerados para módulo '{module_name}'")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao parsear JSON do banner prompt: {e}\nRaw: {raw[:500]}")
            raise RuntimeError(f"A IA retornou um formato inválido. Tente novamente.")
        except Exception as e:
            logger.error(f"Erro ao gerar banner prompt: {e}")
            raise RuntimeError(f"Erro ao gerar prompt de banner: {str(e)}")
