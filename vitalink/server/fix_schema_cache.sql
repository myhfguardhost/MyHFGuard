-- Quick Fix for PostgREST Schema Cache Error
-- Run these queries in Supabase SQL Editor

-- 1. Check for views that might reference date_of_birth
SELECT 
  schemaname, 
  viewname, 
  definition
FROM pg_views
WHERE definition LIKE '%date_of_birth%'
  AND (schemaname = 'public' OR schemaname = 'auth');

-- 2. If you find a view, you'll need to recreate it. Example:
-- DROP VIEW IF EXISTS view_name;
-- CREATE VIEW view_name AS 
--   SELECT patient_id, first_name, last_name, dob, ... 
--   FROM patients;

-- 3. Check for any materialized views
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE definition LIKE '%date_of_birth%';

-- 4. Check for triggers (simpler query)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'patients';

-- 5. Most important: Check if there's a view in the public schema
-- This is the most common cause
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 6. If you want to see all views and their definitions:
SELECT 
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

