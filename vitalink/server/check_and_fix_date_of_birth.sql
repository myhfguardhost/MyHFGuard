-- Comprehensive check and fix for date_of_birth schema cache issue
-- Run these queries in Supabase SQL Editor one by one

-- ============================================
-- STEP 1: Verify the actual column name
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
  AND (column_name LIKE '%birth%' OR column_name LIKE '%dob%')
ORDER BY column_name;

-- Expected: Should only show 'dob', NOT 'date_of_birth'
-- If you see 'date_of_birth', that's the problem - go to STEP 2


-- ============================================
-- STEP 2: If date_of_birth column exists, remove it
-- ============================================
-- ONLY RUN THIS IF STEP 1 SHOWED date_of_birth EXISTS
/*
-- First, migrate any data
UPDATE public.patients
SET dob = date_of_birth
WHERE dob IS NULL AND date_of_birth IS NOT NULL;

-- Then drop the column
ALTER TABLE public.patients DROP COLUMN IF EXISTS date_of_birth;
*/


-- ============================================
-- STEP 3: Check for views that reference date_of_birth
-- ============================================
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%'
ORDER BY viewname;

-- If you find any views, note their names and definitions
-- You'll need to recreate them using 'dob' instead


-- ============================================
-- STEP 4: Check for materialized views
-- ============================================
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%';


-- ============================================
-- STEP 5: Check for functions that reference date_of_birth
-- ============================================
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%date_of_birth%'
  AND n.nspname = 'public'
ORDER BY p.proname;


-- ============================================
-- STEP 6: Check for triggers
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'patients';


-- ============================================
-- STEP 7: Force PostgREST schema cache refresh
-- ============================================
-- Method 1: Add a comment to trigger schema reload
COMMENT ON COLUMN public.patients.dob IS 'Date of birth - patient date of birth';

-- Method 2: Make a harmless schema change (add then remove a comment)
-- This forces PostgREST to reload
DO $$
BEGIN
  -- This will trigger a schema cache refresh
  PERFORM set_config('application_name', 'schema_refresh', false);
END $$;

-- Method 3: Query the table directly (sometimes triggers refresh)
SELECT 
  patient_id,
  first_name,
  last_name,
  dob
FROM public.patients
LIMIT 1;


-- ============================================
-- STEP 8: Check PostgREST configuration
-- ============================================
-- Check what schemas are exposed to PostgREST
SELECT 
  schemaname
FROM pg_namespace
WHERE nspname IN ('public', 'graphql_public');


-- ============================================
-- STEP 9: If you found a view with date_of_birth, fix it
-- ============================================
-- Example (replace 'your_view_name' with actual view name):
/*
-- First, get the full definition
SELECT definition 
FROM pg_views 
WHERE viewname = 'your_view_name';

-- Then drop and recreate with 'dob'
DROP VIEW IF EXISTS your_view_name CASCADE;

CREATE VIEW your_view_name AS 
  SELECT 
    patient_id,
    first_name,
    last_name,
    dob,  -- Changed from date_of_birth
    created_at
  FROM patients;
*/


-- ============================================
-- STEP 10: Final verification
-- ============================================
-- This should work without errors
SELECT 
  patient_id,
  first_name,
  last_name,
  dob,
  created_at
FROM public.patients
LIMIT 5;

