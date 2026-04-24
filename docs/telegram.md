Aqui está o projeto completo. O fluxo funciona assim:

---

## Estrutura gerada

```
membrium/
├── main.py              → Rotas FastAPI (2 endpoints)
├── telegram_service.py  → Toda lógica com o Telegram
├── requirements.txt     → Dependências
├── .env.example         → Modelo de variáveis de ambiente
└── README.md            → Guia completo de uso
```

---

## Ordem de uso

**1. Gerar a sessão** (uma vez só, localmente):
```bash
# Cole o script do README no terminal e autentique com seu número
```

**2. Criar o canal** (uma vez só):
```bash
curl -X POST http://localhost:8000/canal/criar
# → Salve o canal_id retornado no .env
```

**3. Upload de vídeos** (toda vez que cadastrar uma aula):
```bash
curl -X POST "http://localhost:8000/videos/upload?canal_id=-100XXXXXXXXX" \
  -F "arquivos=@aula01.mp4" \
  -F "arquivos=@aula02.mp4"
```

A resposta já traz tudo que você precisa salvar no banco: `message_id`, `canal_id`, duração, resolução, tamanho — que serão usados depois para fazer o streaming por chunks que vimos anteriormente.

# main.py

```python
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import tempfile

from telegram_service import TelegramService

# Instância global do serviço
tg_service = TelegramService(
    api_id=int(os.getenv("TELEGRAM_API_ID", "0")),
    api_hash=os.getenv("TELEGRAM_API_HASH", ""),
    session_name="membrium_session",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicia e encerra o cliente Telegram junto com a aplicação."""
    await tg_service.start()
    print("✅ Cliente Telegram iniciado.")
    yield
    await tg_service.stop()
    print("🔴 Cliente Telegram encerrado.")


app = FastAPI(
    title="Membrium - API de Upload",
    description="Upload de vídeos de cursos via Telegram",
    lifespan=lifespan,
)


# ─────────────────────────────────────────────
# ROTA 1: Criar canal "Membrium" (roda uma vez)
# ─────────────────────────────────────────────
@app.post("/canal/criar", summary="Cria o canal privado no Telegram")
async def criar_canal():
    """
    Cria o canal privado 'Membrium' no Telegram.
    Salve o canal_id retornado no seu .env ou banco de dados.
    """
    resultado = await tg_service.criar_canal(
        titulo="Membrium",
        descricao="Canal privado de armazenamento de vídeos de cursos.",
    )
    return JSONResponse(status_code=201, content=resultado)


# ─────────────────────────────────────────────
# ROTA 2: Upload de 1 ou mais vídeos
# ─────────────────────────────────────────────
@app.post("/videos/upload", summary="Faz upload de 1 ou mais vídeos para o Telegram")
async def upload_videos(
    canal_id: int,
    arquivos: List[UploadFile] = File(...),
):
    """
    Recebe 1 ou mais vídeos, faz upload para o canal do Telegram
    e retorna as informações de cada vídeo enviado.

    - **canal_id**: ID do canal criado em /canal/criar
    - **arquivos**: 1 ou mais arquivos de vídeo
    """
    if not arquivos:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    resultados = []

    for arquivo in arquivos:
        # Valida tipo do arquivo
        if not arquivo.content_type.startswith("video/"):
            raise HTTPException(
                status_code=400,
                detail=f"'{arquivo.filename}' não é um arquivo de vídeo.",
            )

        # Salva temporariamente no disco para o Pyrogram enviar
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f"_{arquivo.filename}"
        ) as tmp:
            conteudo = await arquivo.read()
            tmp.write(conteudo)
            tmp_path = tmp.name

        try:
            info = await tg_service.upload_video(
                canal_id=canal_id,
                caminho=tmp_path,
                nome_original=arquivo.filename,
            )
            resultados.append(info)
        finally:
            os.unlink(tmp_path)  # Remove o arquivo temporário

    return JSONResponse(status_code=200, content={"videos": resultados})
```

```
import os
from pyrogram import Client
from pyrogram.types import Message
from datetime import datetime


class TelegramService:
    """
    Serviço responsável por toda a comunicação com a API do Telegram.
    Usa MTProto via Pyrogram (user account — sem limite de 50MB dos bots).
    """

    def __init__(self, api_id: int, api_hash: str, session_name: str):
        self.client = Client(
            name=session_name,
            api_id=api_id,
            api_hash=api_hash,
        )

    # ─────────────────────────────────────────────
    # Ciclo de vida do cliente
    # ─────────────────────────────────────────────

    async def start(self):
        await self.client.start()

    async def stop(self):
        await self.client.stop()

    # ─────────────────────────────────────────────
    # Criar canal
    # ─────────────────────────────────────────────

    async def criar_canal(self, titulo: str, descricao: str) -> dict:
        """
        Cria um canal privado no Telegram.
        Retorna o canal_id e o invite_link para uso interno.
        """
        canal = await self.client.create_channel(
            title=titulo,
            description=descricao,
        )

        # Gera um link de convite (útil para adicionar admins manualmente)
        invite = await self.client.create_chat_invite_link(canal.id)

        return {
            "canal_id": canal.id,           # Salve isso no .env ou banco
            "canal_nome": canal.title,
            "invite_link": invite.invite_link,
            "criado_em": datetime.utcnow().isoformat(),
            "instrucao": "Salve o canal_id — ele é necessário para os uploads.",
        }

    # ─────────────────────────────────────────────
    # Upload de vídeo
    # ─────────────────────────────────────────────

    async def upload_video(
        self,
        canal_id: int,
        caminho: str,
        nome_original: str,
    ) -> dict:
        """
        Envia um vídeo para o canal e retorna todas as informações
        necessárias para armazenar no banco de dados e fazer streaming.
        """
        inicio = datetime.utcnow()

        msg: Message = await self.client.send_video(
            chat_id=canal_id,
            video=caminho,
            caption=nome_original,
            supports_streaming=True,   # Essencial para streaming por chunks
        )

        video = msg.video

        return {
            # ── Identifiers para salvar no banco ──
            "message_id": msg.id,          # Use para buscar/stream o vídeo
            "canal_id": canal_id,          # Canal onde está armazenado
            "file_id": video.file_id,      # ID interno do arquivo no Telegram
            "file_unique_id": video.file_unique_id,

            # ── Metadados do vídeo ──
            "nome_original": nome_original,
            "tamanho_bytes": video.file_size,
            "tamanho_mb": round(video.file_size / (1024 * 1024), 2),
            "duracao_segundos": video.duration,
            "largura": video.width,
            "altura": video.height,
            "mime_type": video.mime_type,

            # ── Controle ──
            "enviado_em": inicio.isoformat(),
            "data_msg": msg.date.isoformat() if msg.date else None,
        }
```

```
fastapi
uvicorn[standard]
pyrogram
tgcrypto        # acelera criptografia do Telegram (recomendado)
python-dotenv
python-multipart # necessário para upload de arquivos no FastAPI
```

# Membrium — Upload de Vídeos via Telegram

## Pré-requisitos

- Python 3.10+
- Conta no Telegram com API ID e API Hash (veja abaixo)

---

## 1. Configurar credenciais

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env` com seu API_ID e API_HASH obtidos em https://my.telegram.org

---

## 2. Instalar dependências

```bash
pip install -r requirements.txt
```

---

## 3. Gerar a sessão (primeira vez apenas)

Rode o script abaixo **uma única vez** localmente para autenticar sua conta:

```python
from pyrogram import Client
import os, asyncio
from dotenv import load_dotenv

load_dotenv()

async def gerar_sessao():
    app = Client(
        "membrium_session",
        api_id=int(os.getenv("TELEGRAM_API_ID")),
        api_hash=os.getenv("TELEGRAM_API_HASH"),
    )
    async with app:
        me = await app.get_me()
        print(f"✅ Logado como: {me.first_name} ({me.phone_number})")

asyncio.run(gerar_sessao())
```

Isso vai criar o arquivo `membrium_session.session` — **guarde-o com segurança**.

---

## 4. Subir o servidor

```bash
uvicorn main:app --reload
```

---

## 5. Fluxo de uso

### Passo 1 — Criar o canal (rode uma única vez)

```bash
curl -X POST http://localhost:8000/canal/criar
```

Resposta:
```json
{
  "canal_id": -1009876543210,
  "canal_nome": "Membrium",
  "invite_link": "https://t.me/+xxxxxxxxxxxx",
  "criado_em": "2024-01-01T12:00:00",
  "instrucao": "Salve o canal_id — ele é necessário para os uploads."
}
```

➡️ Salve o `canal_id` no seu `.env` como `TELEGRAM_CANAL_ID`.

---

### Passo 2 — Upload de vídeos

```bash
curl -X POST "http://localhost:8000/videos/upload?canal_id=-1009876543210" \
  -F "arquivos=@aula01.mp4" \
  -F "arquivos=@aula02.mp4"
```

Resposta:
```json
{
  "videos": [
    {
      "message_id": 42,
      "canal_id": -1009876543210,
      "file_id": "BQACAgIA...",
      "file_unique_id": "AgAD...",
      "nome_original": "aula01.mp4",
      "tamanho_bytes": 104857600,
      "tamanho_mb": 100.0,
      "duracao_segundos": 3600,
      "largura": 1920,
      "altura": 1080,
      "mime_type": "video/mp4",
      "enviado_em": "2024-01-01T12:05:00",
      "data_msg": "2024-01-01T12:05:03"
    }
  ]
}
```

➡️ Salve `message_id` e `canal_id` no banco vinculados à sua aula.

---

## O que salvar no banco por aula

| Campo          | Uso                                      |
|----------------|------------------------------------------|
| `message_id`   | Para buscar e fazer streaming do vídeo   |
| `canal_id`     | Canal onde o vídeo está                  |
| `tamanho_bytes`| Para o header Content-Length no stream   |
| `duracao_segundos` | Para exibir no player                |
| `mime_type`    | Para o header Content-Type no stream     |

---

## Arquivos importantes

| Arquivo                    | Descrição                                 |
|----------------------------|-------------------------------------------|
| `membrium_session.session` | Sessão do Telegram — nunca suba no git    |
| `.env`                     | Credenciais — nunca suba no git           |
| `main.py`                  | Rotas FastAPI                             |
| `telegram_service.py`      | Toda a lógica de comunicação com Telegram |