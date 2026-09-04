-- Migration: 20260904_add_course_combo.sql
-- Adiciona suporte a combos de cursos para venda/entrega conjunta via Webhook

CREATE TABLE IF NOT EXISTS course_combo (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combo_courses (
    combo_id INTEGER NOT NULL REFERENCES course_combo(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    PRIMARY KEY (combo_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_combo_uuid ON course_combo(uuid);
