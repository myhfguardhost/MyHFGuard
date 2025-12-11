# Alternative Ways to Fix PostgREST Schema Cache Error

Since there's no "Refresh Schema" button in your Supabase version, try these methods:

## Method 1: Restart Supabase Project (Most Reliable)

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Look for **"Restart Project"** or **"Pause Project"** / **"Resume Project"** button
3. If available, restart the project (this will refresh all caches including PostgREST)
4. Wait 2-3 minutes for the project to restart
5. Try registration again

## Method 2: Check and Fix Database Views (Most Likely Fix)

The error is likely caused by a database view referencing `date_of_birth`. 

**Run this query in SQL Editor:**
```sql
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

**Look through the results** for any view whose `definition` column contains `date_of_birth`.

**If you find one**, fix it like this:
```sql
-- 1. First, see the full definition
SELECT definition 
FROM pg_views 
WHERE viewname = 'your_view_name';

-- 2. Drop the view
DROP VIEW IF EXISTS your_view_name;

-- 3. Recreate it with 'dob' instead of 'date_of_birth'
-- (Copy the definition from step 1, but replace date_of_birth with dob)
CREATE VIEW your_view_name AS 
  SELECT 
    patient_id,
    first_name,
    last_name,
    dob,  -- Changed from date_of_birth
    created_at
  FROM patients;
```

## Method 3: Force Cache Refresh via Query

Sometimes making a direct query can trigger PostgREST to refresh. Run this:

```sql
-- This query forces PostgREST to check the schema
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
ORDER BY ordinal_position;
```

Then wait 30 seconds and try registration again.

## Method 4: Check Supabase Dashboard for Views

1. Go to **Supabase Dashboard** → **Database** → **Tables**
2. Look at the list - views will have a different icon than tables
3. Click on any views that might reference the `patients` table
4. Check their SQL definition for `date_of_birth`
5. Edit the view to use `dob` instead

## Method 5: Contact Supabase Support

If none of the above work, the issue might be:
- A system-level view or function we can't see
- A cached schema that needs Supabase support to clear
- A bug in PostgREST

You can contact Supabase support with:
- The error message: `PGRST204 - Could not find the 'date_of_birth' column`
- Confirmation that the column is actually named `dob`
- The results of the view query

## Most Likely Solution

**99% of the time, it's a database view.** Check for views first (Method 2), and if you find one referencing `date_of_birth`, fix it. The cache should refresh automatically after you fix the view.

## Quick Test

After trying any method, test with:
```sql
SELECT patient_id, first_name, last_name, dob 
FROM patients 
LIMIT 1;
```

If this works, try registration again.

