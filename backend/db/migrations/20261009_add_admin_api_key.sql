-- Migration: 20261009_add_admin_api_key.sql
-- Adiciona coluna api_key na tabela admin para integracao com API externa, bots e automacoes.
-- Seguro para apps em producao: utiliza IF NOT EXISTS e indices idempotentes.

ALTER TABLE admin ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_api_key ON admin(api_key);
