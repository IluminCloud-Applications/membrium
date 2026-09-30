-- Migration: 20260929_add_student_activity_log.sql
-- Tabela de logs detalhados de atividades e acessos dos alunos (aulas, login, cursos, progresso)

CREATE TABLE IF NOT EXISTS student_activity_log (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    module_name VARCHAR(150),
    item_name VARCHAR(150),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON student_activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON student_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON student_activity_log(action);
