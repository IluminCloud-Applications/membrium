"""
YouTubeTranscriptTool — Ferramenta reutilizável para transcrição de vídeos do YouTube.

Usa a biblioteca youtube-transcript-api para extrair transcrições.
Reutilizável em FAQ, Transcrições, e outros módulos futuros.
"""

import re
import logging
from urllib.parse import urlparse, parse_qs

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

logger = logging.getLogger("ai.tools.youtube_transcript")


class YouTubeTranscriptTool:
    """Ferramenta para extrair transcrições de vídeos do YouTube."""

    # Regex patterns para extrair video_id de URLs do YouTube
    YOUTUBE_PATTERNS = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
    ]

    @staticmethod
    def extract_video_id(url: str) -> str | None:
        """
        Extrai o video_id de uma URL do YouTube.
        
        Suporta formatos:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        - https://www.youtube.com/shorts/VIDEO_ID
        
        Args:
            url: URL do vídeo do YouTube
        
        Returns:
            Video ID ou None se não for URL válida do YouTube
        """
        if not url:
            return None

        for pattern in YouTubeTranscriptTool.YOUTUBE_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        # Tentar parse via query params como fallback
        try:
            parsed = urlparse(url)
            if "youtube.com" in parsed.netloc:
                params = parse_qs(parsed.query)
                video_id = params.get("v", [None])[0]
                if video_id and len(video_id) == 11:
                    return video_id
        except Exception:
            pass

        return None

    @staticmethod
    def is_youtube_url(url: str) -> bool:
        """Verifica se a URL é do YouTube."""
        return YouTubeTranscriptTool.extract_video_id(url) is not None

    @staticmethod
    def fetch_transcript(
        video_url: str,
        languages: list[str] | None = None,
    ) -> dict:
        """
        Busca a transcrição de um vídeo do YouTube.
        
        Args:
            video_url: URL do vídeo do YouTube
            languages: Lista de idiomas de preferência (padrão: ['pt', 'pt-BR', 'en'])
        
        Returns:
            Dict com:
            - text: Texto completo da transcrição
            - language: Idioma encontrado
            - language_code: Código do idioma
            - is_generated: Se foi gerada automaticamente
            - duration_seconds: Duração estimada em segundos
            - word_count: Contagem de palavras
        
        Raises:
            ValueError: Se não for URL válida do YouTube
            RuntimeError: Se não conseguir obter transcrição
        """
        video_id = YouTubeTranscriptTool.extract_video_id(video_url)
        if not video_id:
            raise ValueError(f"URL inválida do YouTube: {video_url}")
        
        languages = languages or ['pt', 'pt-BR', 'en']
        
        try:
            ytt_api = YouTubeTranscriptApi()
            fetched = ytt_api.fetch(video_id, languages=languages)
            
            # Formatar como texto completo
            formatter = TextFormatter()
            full_text = formatter.format_transcript(fetched)
            
            # Calcular duração estimada
            duration = 0
            if len(fetched) > 0:
                last_snippet = fetched[-1]
                duration = int(last_snippet.start + last_snippet.duration)
            
            word_count = len(full_text.split())
            
            logger.info(
                f"Transcrição obtida: video={video_id}, "
                f"idioma={fetched.language}, palavras={word_count}"
            )
            
            return {
                "text": full_text,
                "language": fetched.language,
                "language_code": fetched.language_code,
                "is_generated": fetched.is_generated,
                "duration_seconds": duration,
                "word_count": word_count,
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erro ao buscar transcrição do vídeo {video_id}: {error_msg}")
            
            if "No transcripts were found" in error_msg:
                raise RuntimeError(
                    "Nenhuma transcrição disponível para este vídeo. "
                    "Verifique se o vídeo tem legendas habilitadas."
                )
            if "Video unavailable" in error_msg:
                raise RuntimeError("Vídeo não encontrado ou indisponível.")
            
            raise RuntimeError(f"Erro ao buscar transcrição: {error_msg}")

    @staticmethod
    def list_available_languages(video_url: str) -> list[dict]:
        """
        Lista os idiomas de transcrição disponíveis para um vídeo.
        
        Args:
            video_url: URL do vídeo do YouTube
        
        Returns:
            Lista de dicts com 'language', 'language_code' e 'is_generated'
        """
        video_id = YouTubeTranscriptTool.extract_video_id(video_url)
        if not video_id:
            raise ValueError(f"URL inválida do YouTube: {video_url}")
        
        try:
            ytt_api = YouTubeTranscriptApi()
            transcript_list = ytt_api.list(video_id)
            
            available = []
            for transcript in transcript_list:
                available.append({
                    "language": transcript.language,
                    "language_code": transcript.language_code,
                    "is_generated": transcript.is_generated,
                })
            
            return available
            
        except Exception as e:
            logger.error(f"Erro ao listar idiomas: {str(e)}")
            raise RuntimeError(f"Erro ao listar idiomas disponíveis: {str(e)}")
