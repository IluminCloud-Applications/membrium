-- Migration: 2026-05-17
-- Description: Simplify membership architecture by removing course groups and showcase-courses associations, and add checkout_url to courses.

-- 1. Add checkout_url to course
ALTER TABLE course ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(500);

-- 2. Drop obsolete association tables and models
DROP TABLE IF EXISTS showcase_courses CASCADE;
DROP TABLE IF EXISTS course_group_courses CASCADE;
DROP TABLE IF EXISTS course_group CASCADE;
