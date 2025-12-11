-- Find all references to date_of_birth in the database
-- Run these queries in Supabase SQL Editor

-- 1. Check for views (most common cause)
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%'
ORDER BY viewname;

-- 2. Check for materialized views
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%';

-- 3. Check for functions (simpler query that should work)
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%date_of_birth%'
  AND n.nspname = 'public'
ORDER BY p.proname;

-- 4. Check for triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'patients';

-- 5. Check for any computed/generated columns (though schema shows none)
SELECT 
  column_name,
  column_default,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
  AND (is_generated = 'ALWAYS' OR column_default IS NOT NULL);

-- 6. Check RLS policies (you already confirmed these are fine, but double-check)
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'patients';

-- 7. Most importantly: Check if PostgREST has any special configuration
-- This queries the PostgREST schema cache directly (if accessible)
SELECT 
  schemaname,
  tablename,
  attname as column_name
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'patients'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

