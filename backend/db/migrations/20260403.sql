-- Migration: 20260403.sql
-- Suporte a vídeos do Telegram na tabela lesson.
-- 
-- O campo video_type já existe e aceita qualquer string (VARCHAR(50)).
-- O campo video_url já existe e é TEXT — armazenará JSON com os metadados do Telegram.
-- 
-- Esta migration garante que o video_type aceita o valor 'telegram'
-- e adiciona um índice para facilitar queries por tipo.
-- Nenhum dado existente é perdido.

-- Índice para filtrar aulas por video_type (telegram, youtube, vturb, etc.)
CREATE INDEX IF NOT EXISTS idx_lesson_video_type ON lesson(video_type);

-- Nenhuma coluna nova necessária: video_url (TEXT) já comporta o JSON do Telegram.
-- Exemplo de valor armazenado:
-- {"message_id": 42, "canal_id": -1009876543210, "tamanho_bytes": 104857600,
--  "duracao_segundos": 3600, "mime_type": "video/mp4", "nome_original": "aula1.mp4"}
