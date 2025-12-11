-- Create a PostgreSQL function to upsert patients, bypassing PostgREST schema cache issues
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION upsert_patient(
  p_patient_id TEXT,
  p_first_name TEXT DEFAULT 'User',
  p_last_name TEXT DEFAULT 'Patient',
  p_dob DATE DEFAULT '1970-01-01'::DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO patients (patient_id, first_name, last_name, dob)
  VALUES (p_patient_id, p_first_name, p_last_name, p_dob)
  ON CONFLICT (patient_id)
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, patients.first_name),
    last_name = COALESCE(EXCLUDED.last_name, patients.last_name),
    dob = COALESCE(EXCLUDED.dob, patients.dob);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_patient TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_patient TO anon;
GRANT EXECUTE ON FUNCTION upsert_patient TO service_role;

-- Test the function
-- SELECT upsert_patient('test-id', 'Test', 'User', '1990-01-01'::DATE);

