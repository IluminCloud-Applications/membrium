import os
import time
import requests
import tempfile
import logging
import json
from models import Lesson
from db.integration_helpers import get_ai_api_key, get_integration
from integrations.telegram.service import stream_video_chunks

logger = logging.getLogger("ai.tools.assemblyai")

class AssemblyAITranscriptTool:
    
    BASE_URL = "https://api.assemblyai.com"

    @staticmethod
    def fetch_transcript(lesson: Lesson) -> dict:
        api_key = get_ai_api_key('assemblyai')
        if not api_key:
            raise RuntimeError("API Key da AssemblyAI não configurada em Integrações.")

        if lesson.video_type != 'telegram':
            raise ValueError("O formato de video não é telegram.")
        
        try:
            meta = json.loads(lesson.video_url)
            message_id = int(meta['message_id'])
            canal_id = int(meta['canal_id'])
            file_size = int(meta.get('tamanho_bytes', 0))
        except (json.JSONDecodeError, KeyError, TypeError):
            raise RuntimeError("Metadados de vídeo Telegram inválidos.")

        _, tg_config = get_integration('telegram')
        if not tg_config.get('session_string'):
            raise RuntimeError("Telegram não configurado ou sessão expirada.")

        api_id = int(tg_config['api_id'])
        api_hash = tg_config['api_hash']
        session_string = tg_config['session_string']

        # Baixar para um arquivo temporario
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        try:
            for chunk in stream_video_chunks(
                api_id=api_id,
                api_hash=api_hash,
                session_string=session_string,
                canal_id=canal_id,
                message_id=message_id,
                offset_bytes=0,
                length=None
            ):
                temp_file.write(chunk)
            temp_file.close()

            # Upload to AssemblyAI
            headers = {"authorization": api_key}
            with open(temp_file.name, "rb") as f:
                upload_resp = requests.post(f"{AssemblyAITranscriptTool.BASE_URL}/v2/upload", headers=headers, data=f)
            if upload_resp.status_code != 200:
                raise RuntimeError(f"Erro ao fazer upload na AssemblyAI: {upload_resp.text}")
                
            audio_url = upload_resp.json()["upload_url"]

            data = {
                "audio_url": audio_url,
                "speech_models": ["universal-3-pro", "universal-2"],
                "language_detection": True,
                "speaker_labels": True
            }

            transcript_resp = requests.post(f"{AssemblyAITranscriptTool.BASE_URL}/v2/transcript", headers=headers, json=data)
            if transcript_resp.status_code != 200:
                raise RuntimeError(f"Erro ao iniciar transcrição: {transcript_resp.text}")
            
            transcript_id = transcript_resp.json()["id"]
            
            # Polling
            polling_endpoint = f"{AssemblyAITranscriptTool.BASE_URL}/v2/transcript/{transcript_id}"
            while True:
                status_resp = requests.get(polling_endpoint, headers=headers).json()
                if status_resp['status'] == 'completed':
                    
                    sentences_url = f"{AssemblyAITranscriptTool.BASE_URL}/v2/transcript/{transcript_id}/sentences"
                    sentences_resp = requests.get(sentences_url, headers=headers)
                    if sentences_resp.status_code == 200:
                        sentences_data = sentences_resp.json().get("sentences", [])
                        srt_content = AssemblyAITranscriptTool._generate_srt(sentences_data)
                        full_text = " ".join([s["text"] for s in sentences_data])
                        duration = sentences_data[-1]["end"] / 1000 if sentences_data else int(meta.get('duracao_segundos', 0))
                    else:
                        full_text = status_resp.get("text", "")
                        srt_content = ""
                        duration = int(meta.get('duracao_segundos', 0))
                    
                    word_count = len(full_text.split())
                    return {
                        "text": full_text,
                        "srt": srt_content,
                        "language": status_resp.get("language_code", "pt"),
                        "language_code": status_resp.get("language_code", "pt"),
                        "is_generated": True,
                        "is_auto_synced": True,
                        "caption_id": "assemblyai",
                        "duration_seconds": duration,
                        "word_count": word_count
                    }
                elif status_resp['status'] == 'error':
                    raise RuntimeError(f"Erro na AssemblyAI: {status_resp.get('error')}")
                else:
                    time.sleep(3)

        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)

    @staticmethod
    def _generate_srt(sentences_data) -> str:
        def ms_to_srt_time(ms):
            s, ms = divmod(ms, 1000)
            m, s = divmod(s, 60)
            h, m = divmod(m, 60)
            return f"{int(h):02}:{int(m):02}:{int(s):02},{int(ms):03}"

        lines = []
        for i, s in enumerate(sentences_data):
            start = ms_to_srt_time(s["start"])
            end = ms_to_srt_time(s["end"])
            lines.append(f"{i+1}")
            lines.append(f"{start} --> {end}")
            lines.append(s["text"])
            lines.append("")
        return "\n".join(lines)
