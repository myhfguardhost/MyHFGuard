# Fix PostgREST Schema Cache Error - Complete Instructions

Based on your actual schema, the column is correctly named `dob`. The error is caused by PostgREST's schema cache being stale.

## Quick Fix Steps:

### Step 1: Check if `date_of_birth` column still exists

Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
  AND (column_name = 'dob' OR column_name = 'date_of_birth')
ORDER BY column_name;
```

**Expected result:** Should only show `dob`. If it shows both `dob` and `date_of_birth`, that's the problem - run Step 2.

### Step 2: If `date_of_birth` column exists, remove it

```sql
-- Migrate any data first (if needed)
UPDATE public.patients
SET dob = date_of_birth
WHERE dob IS NULL AND date_of_birth IS NOT NULL;

-- Drop the old column
ALTER TABLE public.patients DROP COLUMN IF EXISTS date_of_birth;
```

### Step 3: Check for views referencing `date_of_birth`

```sql
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%date_of_birth%'
ORDER BY viewname;
```

If you find any views, drop and recreate them using `dob` instead.

### Step 4: Force PostgREST to refresh schema cache

Since there's no refresh button, force a refresh by making a harmless schema change:

```sql
-- Add a comment (this triggers schema reload)
COMMENT ON COLUMN public.patients.dob IS 'Date of birth';
```

Wait 10-30 seconds, then try registration again.

### Step 5: Alternative - Restart Project

If Step 4 doesn't work:
1. Go to **Settings** → **General**
2. Look for **"Restart Project"** or **"Pause/Resume"**
3. Restart the project (this refreshes all caches)
4. Wait 2-3 minutes
5. Try registration again

## Most Likely Issue:

Your `sample_database.txt` file shows both `dob` and `date_of_birth` columns were created. If the actual database still has the `date_of_birth` column (even though your schema export doesn't show it), that's causing PostgREST to look for it.

**Run Step 1 first** to confirm if `date_of_birth` column exists, then proceed accordingly.

