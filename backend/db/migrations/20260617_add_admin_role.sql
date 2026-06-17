-- Migration: Add role column to admin table for multi-admin support
-- Note: uses plain ALTER TABLE because the migration runner splits on semicolons,
-- which breaks DO $$ blocks. If the column already exists, the runner catches the
-- error and skips it safely.
ALTER TABLE admin ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin';
