-- Fix the date_of_birth column issue
-- Run these queries in Supabase SQL Editor

-- Step 1: Check if date_of_birth column actually exists in the database
-- (Even though your schema shows only dob, the actual DB might still have both)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
  AND (column_name = 'dob' OR column_name = 'date_of_birth')
ORDER BY column_name;

-- Step 2: If date_of_birth column exists, migrate data and drop it
-- (Only run this if Step 1 shows date_of_birth exists)
/*
-- First, copy any data from date_of_birth to dob if dob is NULL
UPDATE public.patients
SET dob = date_of_birth
WHERE dob IS NULL AND date_of_birth IS NOT NULL;

-- Then drop the date_of_birth column
ALTER TABLE public.patients DROP COLUMN IF EXISTS date_of_birth;
*/

-- Step 3: Check for views that reference date_of_birth
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%'
ORDER BY viewname;

-- Step 4: If you find a view, you'll need to recreate it
-- Example (replace with actual view name and definition):
/*
DROP VIEW IF EXISTS your_view_name;
CREATE VIEW your_view_name AS 
  SELECT 
    patient_id,
    first_name,
    last_name,
    dob,  -- Use dob, not date_of_birth
    created_at
  FROM patients;
*/

-- Step 5: Force PostgREST to refresh by making a harmless schema change
-- This will trigger PostgREST to reload its schema cache
COMMENT ON COLUMN public.patients.dob IS 'Date of birth';
-- Then immediately remove the comment if you don't want it
-- COMMENT ON COLUMN public.patients.dob IS NULL;

-- Step 6: Verify the fix
SELECT 
  patient_id,
  first_name,
  last_name,
  dob
FROM public.patients
LIMIT 1;

