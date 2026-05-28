-- Migration: 2026-05-28
-- Description: Add order column to course table for manual sorting.

ALTER TABLE course ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
