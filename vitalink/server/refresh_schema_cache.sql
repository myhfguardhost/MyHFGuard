-- Alternative ways to refresh PostgREST schema cache in Supabase

-- Method 1: Force cache refresh by querying the schema directly
-- This sometimes triggers PostgREST to refresh its cache
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
ORDER BY ordinal_position;

-- Method 2: Check current PostgREST cache status
-- This query will show what PostgREST sees
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  typname as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_type t ON a.atttypid = t.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'patients'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- Method 3: If you have admin access, you can try to notify PostgREST
-- This requires the pg_notify extension (usually available)
-- NOTIFY pgrst, 'reload schema';

-- Method 4: The most reliable way - restart your Supabase project
-- Go to: Settings → General → Restart Project (if available)

