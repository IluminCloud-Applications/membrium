-- Migration: 20260928_add_email_access_tracker.sql
-- Rastreamento de abertura de e-mail de acesso e reenvios automáticos em 30min e 60min (anti-reembolso)

CREATE TABLE IF NOT EXISTS student_email_access_tracker (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
    email VARCHAR(120) NOT NULL,
    tracking_token VARCHAR(64) UNIQUE NOT NULL,
    stage INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    first_sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_check_at TIMESTAMP WITHOUT TIME ZONE,
    opened_at TIMESTAMP WITHOUT TIME ZONE,
    base_url VARCHAR(255),
    student_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_tracker_email ON student_email_access_tracker(email);
CREATE INDEX IF NOT EXISTS idx_email_tracker_token ON student_email_access_tracker(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_tracker_next_check ON student_email_access_tracker(next_check_at);
CREATE INDEX IF NOT EXISTS idx_email_tracker_status ON student_email_access_tracker(status);
