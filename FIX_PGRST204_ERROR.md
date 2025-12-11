# Fix PGRST204 Error: "Could not find the 'date_of_birth' column"

## The Problem
PostgREST (Supabase's API layer) has a stale schema cache that's looking for `date_of_birth` when the column is actually named `dob`.

## Root Causes (in order of likelihood):

1. **Database view** that references `date_of_birth` (most common)
2. **Database function** that references `date_of_birth`
3. **Stale PostgREST schema cache** (needs refresh)
4. **Actual `date_of_birth` column** still exists in database (unlikely based on your schema)

## Step-by-Step Fix:

### Step 1: Run the Diagnostic Queries

Go to **Supabase Dashboard** → **SQL Editor** and run the queries from `vitalink/server/check_and_fix_date_of_birth.sql` one by one.

**Start with Step 1** - verify the column name:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
  AND (column_name LIKE '%birth%' OR column_name LIKE '%dob%')
ORDER BY column_name;
```

**Expected result:** Should only show `dob`. If it shows `date_of_birth`, that's the problem.

### Step 2: Check for Views (Most Likely Cause)

Run Step 3 from the SQL file:
```sql
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%'
ORDER BY viewname;
```

**If you find a view:**
1. Note the view name and its definition
2. Drop the view: `DROP VIEW IF EXISTS view_name CASCADE;`
3. Recreate it using `dob` instead of `date_of_birth`

### Step 3: Force Schema Cache Refresh

Since there's no refresh button, try these methods:

**Method A: Add a comment (triggers refresh)**
```sql
COMMENT ON COLUMN public.patients.dob IS 'Date of birth - patient date of birth';
```
Wait 30 seconds, then try registration again.

**Method B: Restart Supabase Project**
1. Go to **Settings** → **General**
2. Look for **"Restart Project"** or **"Pause/Resume"**
3. Restart and wait 2-3 minutes

**Method C: Make a harmless schema change**
```sql
-- Add a temporary column, then remove it
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS _temp_refresh_check BOOLEAN DEFAULT FALSE;
ALTER TABLE public.patients DROP COLUMN IF EXISTS _temp_refresh_check;
```
This forces PostgREST to reload the schema.

### Step 4: Verify the Fix

After making changes, test:
```sql
SELECT patient_id, first_name, last_name, dob 
FROM public.patients 
LIMIT 1;
```

If this works, try registration again.

## Most Likely Solution:

**99% of the time, it's a database view.** Check Step 3 from the SQL file first. If you find a view referencing `date_of_birth`, drop and recreate it with `dob`.

## If Nothing Works:

1. Contact Supabase Support with:
   - Error: `PGRST204 - Could not find the 'date_of_birth' column`
   - Confirmation that column is `dob` (from Step 1)
   - Results of view check (Step 3)
   - Request schema cache refresh

2. Alternative: Use the RPC function workaround (already in code, but requires creating the function first)

