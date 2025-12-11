# Fix PostgREST Schema Cache Error for date_of_birth

## The Problem
Error: `PGRST204 - Could not find the 'date_of_birth' column of 'patients' in the schema cache`

This happens because PostgREST (Supabase's API layer) has a stale schema cache that's looking for `date_of_birth` when the column is actually named `dob`.

## Solution Steps

### Step 1: Create the PostgreSQL Function (Bypasses Schema Cache)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `create_upsert_function.sql`
3. Click **Run** to create the function
4. This function will bypass PostgREST's schema validation

### Step 2: Check for Database-Level References

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the queries from `check_schema.sql`
3. Run each query to check for:
   - Views that reference `date_of_birth`
   - Functions that reference `date_of_birth`
   - Triggers that reference `date_of_birth`
   - RLS policies that reference `date_of_birth`

### Step 3: Fix Any Found References

If you find any views, functions, triggers, or policies referencing `date_of_birth`:

**For Views:**
```sql
-- Drop and recreate the view with 'dob' instead
DROP VIEW IF EXISTS view_name;
CREATE VIEW view_name AS 
SELECT ..., dob, ... FROM patients;
```

**For Functions:**
```sql
-- Update the function to use 'dob'
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS ...
AS $$
  SELECT ..., dob, ... FROM patients;
$$;
```

**For RLS Policies:**
```sql
-- Drop and recreate the policy
DROP POLICY IF EXISTS policy_name ON patients;
CREATE POLICY policy_name ON patients
  FOR SELECT USING (dob IS NOT NULL); -- Use dob instead of date_of_birth
```

### Step 4: Refresh Schema Cache

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Look for **"Reload Schema"** or **"Refresh Schema Cache"**
3. Click it and wait 10-30 seconds

### Step 5: Test

Try registering a user again. The code will:
1. First try the standard upsert
2. If it gets the schema cache error, it will automatically try the RPC function
3. The RPC function bypasses PostgREST's schema validation

## Alternative: Direct SQL Fix

If the above doesn't work, you can also try:

1. Go to **Supabase Dashboard** → **Table Editor** → **patients**
2. Check if there's actually a column named `date_of_birth` (there shouldn't be)
3. If there is, you need to:
   - Migrate data from `date_of_birth` to `dob`
   - Drop the `date_of_birth` column
   - Or rename `date_of_birth` to `dob`

## Most Common Cause

The most common cause is a **database view** that was created with `date_of_birth` as an alias. Check for views first:

```sql
SELECT viewname, definition 
FROM pg_views 
WHERE definition LIKE '%date_of_birth%';
```

If you find one, recreate it to use `dob` instead.

