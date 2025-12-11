-- Remove the duplicate date_of_birth column from patients table
-- This fixes the PostgREST schema cache error (PGRST204)

-- Step 1: Check current columns (run this first to see what we have)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'patients'
  AND column_name IN ('dob', 'date_of_birth')
ORDER BY column_name;

-- Step 2: If date_of_birth has data that dob doesn't have, copy it first
-- (Only run this if needed - check the data first)
-- UPDATE public.patients
-- SET dob = date_of_birth
-- WHERE dob IS NULL AND date_of_birth IS NOT NULL;

-- Step 3: Drop the date_of_birth column
ALTER TABLE public.patients 
DROP COLUMN IF EXISTS date_of_birth;

-- Step 4: Verify it's gone (should only show 'dob' now)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'patients'
ORDER BY ordinal_position;

-- Step 5: Force PostgREST to refresh its schema cache
-- Go to Supabase Dashboard → API Settings → Reload Schema
-- OR wait a few minutes for automatic refresh
