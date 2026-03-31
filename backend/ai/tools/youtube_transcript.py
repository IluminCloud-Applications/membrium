"""
YouTubeTranscriptTool — Ferramenta reutilizável para transcrição de vídeos do YouTube.

Utiliza a biblioteca youtube-transcript-api (scraping), permitindo extrair
legendas automáticas ou manuais de QUALQUER vídeo público ou não listado,
sem depender de tokens OAuth (o que contorna o erro 403 da API oficial do Google).
"""

import re
import logging
from urllib.parse import urlparse, parse_qs
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import SRTFormatter
try:
    from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
except ImportError:
    pass

logger = logging.getLogger("ai.tools.youtube_transcript")


class YouTubeTranscriptTool:
    """Ferramenta para extrair transcrições de vídeos do YouTube via scraping."""

    YOUTUBE_PATTERNS = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
    ]

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """
        Extrai o video_id de uma URL do YouTube.
        """
        if not url:
            return None

        for pattern in YouTubeTranscriptTool.YOUTUBE_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

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
    def _get_api_instance() -> YouTubeTranscriptApi:
        """Retorna uma instância configurada do YouTubeTranscriptApi, injetando Proxy se configurado."""
        from db.integration_helpers import get_integration
        try:
            proxy_enabled, proxy_config = get_integration('proxy')
        except RuntimeError:
            proxy_enabled, proxy_config = False, {}
        
        http_client = None
        if proxy_enabled and proxy_config.get('url'):
            import requests
            http_client = requests.Session()
            proxy_url = proxy_config['url']
            http_client.proxies = {
                "http": proxy_url,
                "https": proxy_url
            }
            logger.info("Usando proxy rotativo para YouTube Transcript API.")

        return YouTubeTranscriptApi(http_client=http_client)

    @staticmethod
    def list_available_languages(video_url: str) -> list:
        """
        Lista os idiomas de transcrição disponíveis para um vídeo.
        """
        video_id = YouTubeTranscriptTool.extract_video_id(video_url)
        if not video_id:
            raise ValueError(f"URL inválida do YouTube: {video_url}")

        try:
            api = YouTubeTranscriptTool._get_api_instance()
            transcript_list = api.list(video_id)
            result = []

            for transcript in transcript_list:
                result.append({
                    "language": transcript.language,
                    "language_code": transcript.language_code,
                    "is_generated": transcript.is_generated,
                })

            return result
        except Exception as e:
            logger.error(f"Erro ao listar idiomas do vídeo {video_id}: {e}")
            raise RuntimeError(f"Erro ao listar transcrições: {str(e)}")

    @staticmethod
    def fetch_transcript(
        video_url: str,
        languages: list = None,
    ) -> dict:
        """
        Busca a transcrição de um vídeo do YouTube em texto e em SRT.
        Prioriza os idiomas informados na lista `languages`.
        """
        video_id = YouTubeTranscriptTool.extract_video_id(video_url)
        if not video_id:
            raise ValueError(f"URL inválida do YouTube: {video_url}")

        languages = languages or ['pt', 'pt-BR', 'en']

        try:
            # Busca a lista de transcrições usando a nova API instanciada
            api = YouTubeTranscriptTool._get_api_instance()
            transcript_list = api.list(video_id)

            # Tenta encontrar a transcrição que faça match com os idiomas preferidos
            try:
                transcript = transcript_list.find_transcript(languages)
            except Exception:
                # Se não encontrar nos idiomas preferidos, pega a de inglês ou a primeira que vier
                for t in transcript_list:
                    transcript = t
                    break

            if not transcript:
                raise RuntimeError("Nenhuma transcrição encontrada para este vídeo.")

            # Coleta os dados detalhados da legenda
            transcript_data = transcript.fetch()

            # Constrói o texto corrido (limpo) tratando tanto Dicionários quanto os novos Objetos (v1.2.x+)
            full_text = " ".join([
                chunk['text'] if isinstance(chunk, dict) else getattr(chunk, 'text', '')
                for chunk in transcript_data
            ])

            # Formata os dados para SRT (nativo do player)
            srt_formatter = SRTFormatter()
            srt_content = srt_formatter.format_transcript(transcript_data)

            # Calcula duração total sumária a partir do último chunk se possível
            duration = None
            if transcript_data:
                last_chunk = transcript_data[-1]
                if isinstance(last_chunk, dict):
                    duration = last_chunk.get('start', 0) + last_chunk.get('duration', 0)
                else:
                    duration = getattr(last_chunk, 'start', 0) + getattr(last_chunk, 'duration', 0)

            word_count = len(full_text.split())

            logger.info(f"Transcrição extraída: video={video_id}, idioma={transcript.language_code}, palavras={word_count}")

            return {
                "text": full_text,
                "srt": srt_content,
                "language": transcript.language,
                "language_code": transcript.language_code,
                "is_generated": transcript.is_generated,
                "is_auto_synced": transcript.is_generated,
                "caption_id": getattr(transcript, 'translation_languages', None) and "translated" or "scraped",
                "duration_seconds": duration,
                "word_count": word_count,
            }

        except Exception as e:
            error_class_name = type(e).__name__
            logger.error(f"Erro ao buscar transcrição do vídeo {video_id}: {error_class_name} - {str(e)}")

            if error_class_name == 'TranscriptsDisabled':
                raise RuntimeError("O autor do vídeo desativou as legendas/transcrições (Transcripts Disabled).")
            elif error_class_name == 'NoTranscriptFound':
                raise RuntimeError("Nenhuma transcrição foi encontrada para este vídeo.")
            elif error_class_name == 'VideoUnavailable':
                raise RuntimeError("Vídeo indisponível (privado, deletado ou erro de região).")

            raise RuntimeError(f"Erro ao processar legenda do vídeo {video_id}. Detalhe: {str(e)}")
