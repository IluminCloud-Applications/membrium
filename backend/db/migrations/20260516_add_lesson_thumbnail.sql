-- Migration: Add thumbnail_url column to lesson table
-- Date: 2026-05-16
-- Purpose: Store pre-generated thumbnail URLs for R2 videos (extracted via cv2 during upload)
--          and for YouTube lessons (derived from video ID on save).

ALTER TABLE lesson ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
