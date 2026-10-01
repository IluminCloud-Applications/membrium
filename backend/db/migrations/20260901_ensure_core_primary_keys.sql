-- Migration: 20260901_ensure_core_primary_keys.sql
-- Garante que tabelas base possuam PRIMARY KEY antes de migrations subsequentes criarem FOREIGN KEYs para elas.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_pkey') THEN
            ALTER TABLE student ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_pkey') THEN
            ALTER TABLE course ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_pkey') THEN
            ALTER TABLE admin ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_pkey') THEN
            ALTER TABLE document ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'module_pkey') THEN
            ALTER TABLE module ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotion') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotion_pkey') THEN
            ALTER TABLE promotion ADD PRIMARY KEY (id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_config') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integration_config_pkey') THEN
            ALTER TABLE integration_config ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;

DELETE FROM student_courses a USING student_courses b 
WHERE a.ctid < b.ctid AND a.student_id = b.student_id AND a.course_id = b.course_id;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_courses') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_courses_pkey') THEN
            ALTER TABLE student_courses ADD PRIMARY KEY (student_id, course_id);
        END IF;
    END IF;
END $$;
