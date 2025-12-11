-- Run these queries in Supabase SQL Editor to diagnose the date_of_birth issue

-- 1. Check if the column is actually named 'dob'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients' 
  AND (column_name LIKE '%birth%' OR column_name LIKE '%dob%')
ORDER BY column_name;

-- 2. Check for views that reference date_of_birth
-- Run this query first - it's the most likely cause
SELECT schemaname, viewname, definition
FROM pg_views
WHERE definition LIKE '%date_of_birth%'
  AND definition LIKE '%patients%';

-- 2a. Also check ALL views in public schema (in case the above doesn't catch it)
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. Check for functions that reference date_of_birth (simplified query)
SELECT 
  n.nspname as schema, 
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%date_of_birth%'
  AND p.prosrc LIKE '%patients%';

-- 4. Check for triggers on patients table
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'patients';

-- 5. Check RLS policies on patients table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';

-- 6. Check for computed columns or generated columns
SELECT column_name, column_default, is_generated, generation_expression
FROM information_schema.columns
WHERE table_name = 'patients'
  AND (is_generated = 'ALWAYS' OR column_default IS NOT NULL);

-- 7. If you find date_of_birth references, you may need to:
--    - Drop and recreate views
--    - Update functions
--    - Update RLS policies
--    - Remove triggers

-- 8. To fix: If there's a view, you might need to recreate it:
--    DROP VIEW IF EXISTS view_name;
--    CREATE VIEW view_name AS SELECT ..., dob as date_of_birth, ... FROM patients;

