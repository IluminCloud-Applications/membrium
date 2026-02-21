"""
TranscriptMetadataAI — Geração de metadados de transcrições com IA.

Extrai keywords e resumo de transcrições para otimizar buscas.
"""

import json
import logging
from langchain_core.output_parsers import StrOutputParser

from ai.core.config import get_llm
from ai.core.prompts import TRANSCRIPT_METADATA_PROMPT

logger = logging.getLogger("ai.models.transcript_metadata")


class TranscriptMetadataAI:
    """Classe para geração de metadados de transcrições com IA."""

    @staticmethod
    def generate_metadata(
        transcript_text: str,
        provider: str,
        api_key: str,
        model: str | None = None,
    ) -> dict:
        """
        Gera keywords e resumo de uma transcrição.
        
        Args:
            transcript_text: Texto da transcrição
            provider: 'gemini' ou 'openai'
            api_key: Chave API do provider
            model: Nome do modelo (opcional)
        
        Returns:
            Dict com 'keywords' e 'summary'
        """
        if not transcript_text or not transcript_text.strip():
            raise ValueError("Transcrição vazia.")

        try:
            llm = get_llm(provider, api_key, model, temperature=0.3)
            parser = StrOutputParser()
            
            chain = TRANSCRIPT_METADATA_PROMPT | llm | parser
            
            raw_response = chain.invoke({
                "transcript_text": transcript_text[:3000],
            })
            
            return TranscriptMetadataAI._parse_response(raw_response)
            
        except Exception as e:
            logger.error(f"Erro ao gerar metadados: {str(e)}")
            raise RuntimeError(f"Erro ao gerar metadados: {str(e)}")

    @staticmethod
    def _parse_response(raw_response: str) -> dict:
        """Faz parse da resposta e retorna keywords + summary."""
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
        except json.JSONDecodeError:
            logger.error(f"Erro ao fazer parse do JSON de metadados")
            return {"keywords": "", "summary": ""}
        
        return {
            "keywords": parsed.get("keywords", ""),
            "summary": parsed.get("summary", ""),
        }
