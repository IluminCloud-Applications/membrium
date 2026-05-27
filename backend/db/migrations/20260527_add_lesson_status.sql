-- Migration: 2026-05-27
-- Description: Add status column to lesson table for draft/published workflow.
--              Existing lessons are automatically set to 'published'.

-- 1. Add status column (default 'published' so existing rows are immediately visible to students)
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';

-- 2. Ensure all existing lessons are marked as published
UPDATE lesson SET status = 'published' WHERE status != 'published';

-- 3. Index to speed up member-side filtering
CREATE INDEX IF NOT EXISTS idx_lesson_status ON lesson(status);
