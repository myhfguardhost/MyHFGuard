# Fix Supabase Schema Cache Error

## Error
```
ensurePatient error {
  code: 'PGRST204',
  message: "Could not find the 'date_of_birth' column of 'patients' in the schema cache"
}
```

## Root Cause
Supabase's PostgREST (PGRST) schema cache is looking for `date_of_birth` but the column is actually named `dob`. This can happen if:
1. Schema cache is stale
2. Database views/functions reference `date_of_birth`
3. RLS policies reference `date_of_birth`

## Solutions

### Solution 1: Refresh Schema Cache in Supabase Dashboard (Easiest)

**Steps:**
1. Go to **Supabase Dashboard** → Your Project
2. Go to **Settings** → **API**
3. Look for **"Reload Schema"** or **"Refresh Schema Cache"** button
4. Click it to refresh the PostgREST schema cache
5. Wait 10-30 seconds for cache to refresh
6. Try registering again

### Solution 2: Check Database Views and Functions

**Steps:**
1. Go to **Supabase Dashboard** → **Database** → **Functions**
2. Check if any functions reference `date_of_birth`
3. If found, update them to use `dob`

**Or run SQL:**
```sql
-- Check for views that might reference date_of_birth
SELECT viewname, definition 
FROM pg_views 
WHERE definition LIKE '%date_of_birth%';

-- Check for functions that might reference date_of_birth
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%date_of_birth%';
```

### Solution 3: Check RLS Policies

**Steps:**
1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Check the `patients` table policies
3. Look for any policies that reference `date_of_birth`
4. Update them to use `dob`

**Or run SQL:**
```sql
-- Check RLS policies on patients table
SELECT schemaname, tablename, policyname, definition
FROM pg_policies
WHERE tablename = 'patients' AND definition LIKE '%date_of_birth%';
```

### Solution 4: Verify Column Name in Database

**Steps:**
1. Go to **Supabase Dashboard** → **Table Editor** → **patients**
2. Check the column name - it should be `dob` (not `date_of_birth`)
3. If it's `date_of_birth`, you need to rename it:

```sql
-- Rename column if it's actually named date_of_birth
ALTER TABLE patients RENAME COLUMN date_of_birth TO dob;
```

### Solution 5: Restart Supabase Project

**Steps:**
1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Click **"Restart Project"** (if available)
3. This will refresh all caches including PostgREST schema cache

### Solution 6: Check for Database Triggers

**Steps:**
1. Run this SQL in Supabase SQL Editor:

```sql
-- Check for triggers on patients table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'patients';
```

2. If any triggers reference `date_of_birth`, update them

## Quick Test

After applying any solution, test by running this in Supabase SQL Editor:

```sql
-- Test that dob column exists and works
SELECT patient_id, first_name, last_name, dob 
FROM patients 
LIMIT 1;
```

If this works, the schema is correct. Then try registering a user again.

## Most Likely Fix

**Try Solution 1 first** (Refresh Schema Cache) - this fixes 90% of these issues.

If that doesn't work, check if there are any database views, functions, or policies that reference `date_of_birth` and update them to use `dob`.

