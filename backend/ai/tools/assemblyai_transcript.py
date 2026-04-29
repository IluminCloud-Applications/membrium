"""
AssemblyAI transcription tool — submits a public audio/video URL to AssemblyAI and
polls until the job completes. Designed for Cloudflare R2-hosted videos: AssemblyAI
fetches the file from the public custom-domain URL, so no bytes pass through us.
"""
import logging
import time
from typing import Optional

import requests

logger = logging.getLogger("ai.tools.assemblyai_transcript")

API_BASE = "https://api.assemblyai.com"
SUBMIT_URL = f"{API_BASE}/v2/transcript"
POLL_INTERVAL_SECONDS = 4
POLL_TIMEOUT_SECONDS = 60 * 30  # 30 minutes — long enough for ~3h videos


class AssemblyAITranscriptTool:
    @staticmethod
    def transcribe(audio_url: str, api_key: str, language_detection: bool = True) -> dict:
        """
        Submit a URL for transcription and block until done.

        Returns: { text, language_code, duration_seconds, word_count }
        Raises:  RuntimeError on failure or timeout.
        """
        if not api_key:
            raise RuntimeError("API Key da AssemblyAI não configurada")
        if not audio_url:
            raise RuntimeError("audio_url ausente")

        headers = {"authorization": api_key}
        payload = {
            "audio_url": audio_url,
            "language_detection": language_detection,
            # universal-3-pro for en/es/de/fr/it/pt; universal-2 covers the rest
            "speech_models": ["universal-3-pro", "universal-2"],
        }

        logger.info(f"AssemblyAI submit: {audio_url}")
        resp = requests.post(SUBMIT_URL, json=payload, headers=headers, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"Falha ao submeter para AssemblyAI: {resp.status_code} {resp.text}")

        body = resp.json()
        transcript_id = body.get("id")
        if not transcript_id:
            raise RuntimeError(f"AssemblyAI não retornou id: {body}")

        return AssemblyAITranscriptTool._poll(transcript_id, headers)

    @staticmethod
    def _poll(transcript_id: str, headers: dict) -> dict:
        poll_url = f"{API_BASE}/v2/transcript/{transcript_id}"
        deadline = time.time() + POLL_TIMEOUT_SECONDS

        while True:
            if time.time() > deadline:
                raise RuntimeError("Timeout aguardando transcrição da AssemblyAI")

            resp = requests.get(poll_url, headers=headers, timeout=30)
            if resp.status_code >= 400:
                raise RuntimeError(f"Falha ao consultar status: {resp.status_code} {resp.text}")

            data = resp.json()
            status = data.get("status")

            if status == "completed":
                text = data.get("text") or ""
                # `audio_duration` is in seconds (float) per AssemblyAI's response schema
                duration = data.get("audio_duration")
                duration_seconds: Optional[int] = int(duration) if duration else None
                language_code = data.get("language_code") or "pt"
                word_count = len(text.split())
                logger.info(
                    f"AssemblyAI completed: id={transcript_id}, words={word_count}, "
                    f"lang={language_code}"
                )
                return {
                    "text": text,
                    "language_code": language_code,
                    "duration_seconds": duration_seconds,
                    "word_count": word_count,
                }

            if status == "error":
                raise RuntimeError(f"AssemblyAI erro: {data.get('error', 'desconhecido')}")

            time.sleep(POLL_INTERVAL_SECONDS)
