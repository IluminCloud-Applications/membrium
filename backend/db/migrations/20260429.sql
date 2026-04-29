-- Migration: 20260429.sql
-- Remoção completa do Telegram da aplicação

-- Remove as configurações do provedor Telegram da tabela de integrações
DELETE FROM integration_config WHERE provider = 'telegram';

-- Atualiza as aulas que usavam o Telegram para o tipo 'custom'
-- para não quebrar a UI, já que a integração não existe mais
UPDATE lesson SET video_type = 'custom' WHERE video_type = 'telegram';
