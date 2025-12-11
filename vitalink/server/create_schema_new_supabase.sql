-- Clean schema for new Supabase project
-- Only includes tables needed for Health Connect data collection
-- Removed: authentication tables, unused features (medications, appointments, etc.)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequences for auto-incrementing IDs
CREATE SEQUENCE IF NOT EXISTS public.hr_sample_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.spo2_sample_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.steps_event_id_seq;

-- Core: Patients table (ONLY dob, NO date_of_birth)
CREATE TABLE IF NOT EXISTS public.patients (
  patient_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_user_id uuid,
  short_id text,
  PRIMARY KEY (patient_id)
);
CREATE INDEX IF NOT EXISTS idx_patients_owner ON public.patients(owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS patients_short_id_unique ON public.patients(short_id) WHERE short_id IS NOT NULL;

-- Data origin tracking
CREATE TABLE IF NOT EXISTS public.data_origin (
  origin_id text NOT NULL,
  app_package text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (origin_id)
);

-- Device tracking
CREATE TABLE IF NOT EXISTS public.devices (
  device_id text NOT NULL,
  patient_id uuid NOT NULL,
  manufacturer text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id),
  CONSTRAINT devices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_devices_patient ON public.devices(patient_id);

-- Device sync status
CREATE TABLE IF NOT EXISTS public.device_sync_status (
  patient_id uuid NOT NULL,
  origin_id text NOT NULL,
  last_sync_ts timestamptz,
  status text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (patient_id, origin_id),
  CONSTRAINT device_sync_status_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_device_sync_status_patient ON public.device_sync_status(patient_id);

-- Steps: Event level (raw data from Health Connect)
CREATE TABLE IF NOT EXISTS public.steps_event (
  id bigint NOT NULL DEFAULT nextval('public.steps_event_id_seq'::regclass),
  patient_id uuid NOT NULL,
  origin_id text,
  device_id text,
  start_ts timestamptz NOT NULL,
  end_ts timestamptz NOT NULL,
  count integer NOT NULL CHECK (count >= 0),
  record_uid text UNIQUE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT steps_event_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT steps_event_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.data_origin(origin_id),
  CONSTRAINT steps_event_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id)
);
CREATE INDEX IF NOT EXISTS idx_steps_event_patient_time ON public.steps_event(patient_id, start_ts);

-- Steps: Hourly aggregates
CREATE TABLE IF NOT EXISTS public.steps_hour (
  patient_id uuid NOT NULL,
  hour_ts timestamptz NOT NULL,
  steps_total integer NOT NULL CHECK (steps_total >= 0),
  PRIMARY KEY (patient_id, hour_ts),
  CONSTRAINT steps_hour_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_steps_hour_patient_hour ON public.steps_hour(patient_id, hour_ts);

-- Steps: Daily aggregates
CREATE TABLE IF NOT EXISTS public.steps_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  steps_total integer NOT NULL CHECK (steps_total >= 0),
  PRIMARY KEY (patient_id, date),
  CONSTRAINT steps_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_steps_day_patient_date ON public.steps_day(patient_id, date);

-- Distance: Event level
CREATE TABLE IF NOT EXISTS public.distance_event (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  patient_id uuid NOT NULL,
  origin_id text,
  device_id text,
  start_ts timestamptz NOT NULL,
  end_ts timestamptz NOT NULL,
  meters integer NOT NULL CHECK (meters >= 0),
  record_uid text UNIQUE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT distance_event_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT distance_event_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.data_origin(origin_id),
  CONSTRAINT distance_event_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id)
);

-- Distance: Hourly aggregates
CREATE TABLE IF NOT EXISTS public.distance_hour (
  patient_id uuid NOT NULL,
  hour_ts timestamptz NOT NULL,
  meters_total integer NOT NULL CHECK (meters_total >= 0),
  PRIMARY KEY (patient_id, hour_ts),
  CONSTRAINT distance_hour_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);

-- Distance: Daily aggregates
CREATE TABLE IF NOT EXISTS public.distance_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  meters_total integer NOT NULL CHECK (meters_total >= 0),
  PRIMARY KEY (patient_id, date),
  CONSTRAINT distance_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);

-- Heart Rate: Sample level (raw data from Health Connect)
CREATE TABLE IF NOT EXISTS public.hr_sample (
  id bigint NOT NULL DEFAULT nextval('public.hr_sample_id_seq'::regclass),
  patient_id uuid NOT NULL,
  origin_id text,
  device_id text,
  time_ts timestamptz NOT NULL,
  bpm smallint NOT NULL CHECK (bpm >= 10 AND bpm <= 250),
  record_uid text UNIQUE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT hr_sample_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT hr_sample_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.data_origin(origin_id),
  CONSTRAINT hr_sample_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id)
);
CREATE INDEX IF NOT EXISTS idx_hr_sample_patient_time ON public.hr_sample(patient_id, time_ts);

-- Heart Rate: Hourly aggregates
CREATE TABLE IF NOT EXISTS public.hr_hour (
  patient_id uuid NOT NULL,
  hour_ts timestamptz NOT NULL,
  hr_min smallint,
  hr_max smallint,
  hr_avg real,
  hr_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (patient_id, hour_ts),
  CONSTRAINT hr_hour_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_hr_hour_patient_hour ON public.hr_hour(patient_id, hour_ts);

-- Heart Rate: Daily aggregates
CREATE TABLE IF NOT EXISTS public.hr_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  hr_min smallint,
  hr_max smallint,
  hr_avg real,
  hr_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (patient_id, date),
  CONSTRAINT hr_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_hr_day_patient_date ON public.hr_day(patient_id, date);

-- SpO2: Sample level (raw data from Health Connect)
CREATE TABLE IF NOT EXISTS public.spo2_sample (
  id bigint NOT NULL DEFAULT nextval('public.spo2_sample_id_seq'::regclass),
  patient_id uuid NOT NULL,
  origin_id text,
  device_id text,
  time_ts timestamptz NOT NULL,
  spo2_pct real NOT NULL CHECK (spo2_pct >= 0::double precision AND spo2_pct <= 100::double precision),
  record_uid text UNIQUE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT spo2_sample_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT spo2_sample_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.data_origin(origin_id),
  CONSTRAINT spo2_sample_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id)
);
CREATE INDEX IF NOT EXISTS idx_spo2_sample_patient_time ON public.spo2_sample(patient_id, time_ts);

-- SpO2: Hourly aggregates
CREATE TABLE IF NOT EXISTS public.spo2_hour (
  patient_id uuid NOT NULL,
  hour_ts timestamptz NOT NULL,
  spo2_min real,
  spo2_max real,
  spo2_avg real,
  spo2_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (patient_id, hour_ts),
  CONSTRAINT spo2_hour_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_spo2_hour_patient_hour ON public.spo2_hour(patient_id, hour_ts);

-- SpO2: Daily aggregates
CREATE TABLE IF NOT EXISTS public.spo2_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  spo2_min real,
  spo2_max real,
  spo2_avg real,
  spo2_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (patient_id, date),
  CONSTRAINT spo2_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_spo2_day_patient_date ON public.spo2_day(patient_id, date);

-- Reminders (used by mobile app)
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  due_ts timestamptz NOT NULL,
  recurrence text,
  notes text,
  status text NOT NULL DEFAULT 'upcoming'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT reminders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON public.reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(due_ts);

-- Patient Settings (used by web app)
CREATE TABLE IF NOT EXISTS public.patient_settings (
  patient_id uuid NOT NULL,
  daily_check_enabled boolean DEFAULT true,
  daily_check_time time WITHOUT time zone DEFAULT '09:00:00'::time,
  sync_notice_enabled boolean DEFAULT true,
  sync_stale_threshold_min integer DEFAULT 180,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (patient_id),
  CONSTRAINT patient_settings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_patient_settings_patient ON public.patient_settings(patient_id);

-- Blood Pressure: Readings (used by web app)
CREATE TABLE IF NOT EXISTS public.bp_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  reading_time time WITHOUT time zone NOT NULL DEFAULT CURRENT_TIME,
  systolic integer NOT NULL CHECK (systolic >= 70 AND systolic <= 260),
  diastolic integer NOT NULL CHECK (diastolic >= 40 AND diastolic <= 160),
  pulse integer NOT NULL CHECK (pulse >= 30 AND pulse <= 240),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id),
  CONSTRAINT bp_readings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bp_readings_patient_date ON public.bp_readings(patient_id, reading_date);

-- Blood Pressure: Daily aggregates
CREATE TABLE IF NOT EXISTS public.bp_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  sbp_min integer,
  sbp_max integer,
  sbp_avg integer,
  dbp_min integer,
  dbp_max integer,
  dbp_avg integer,
  pulse_avg integer,
  PRIMARY KEY (patient_id, date),
  CONSTRAINT bp_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bp_day_patient_date ON public.bp_day(patient_id, date);

-- Weight: Sample level (used by web app SelfCheck)
CREATE TABLE IF NOT EXISTS public.weight_sample (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  time_ts timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  time_inferred boolean NOT NULL DEFAULT false,
  kg numeric(5,1) NOT NULL,
  origin_id text DEFAULT 'self_input'::text,
  device_id text DEFAULT 'manual'::text,
  record_uid text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT weight_sample_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_weight_sample_patient_time ON public.weight_sample(patient_id, time_ts);

-- Weight: Daily aggregates
CREATE TABLE IF NOT EXISTS public.weight_day (
  patient_id uuid NOT NULL,
  date date NOT NULL,
  kg_min numeric(5,1),
  kg_max numeric(5,1),
  kg_avg numeric(5,1),
  PRIMARY KEY (patient_id, date),
  CONSTRAINT weight_day_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_weight_day_patient_date ON public.weight_day(patient_id, date);

-- Symptom Log (used by web app SelfCheck)
CREATE TABLE IF NOT EXISTS public.symptom_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT (timezone('UTC'::text, now()))::date,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  cough integer NOT NULL DEFAULT 0 CHECK (cough >= 0 AND cough <= 5),
  sob_activity integer NOT NULL DEFAULT 0 CHECK (sob_activity >= 0 AND sob_activity <= 5),
  leg_swelling integer NOT NULL DEFAULT 0 CHECK (leg_swelling >= 0 AND leg_swelling <= 5),
  sudden_weight_gain integer NOT NULL DEFAULT 0 CHECK (sudden_weight_gain >= 0 AND sudden_weight_gain <= 5),
  abd_discomfort integer NOT NULL DEFAULT 0 CHECK (abd_discomfort >= 0 AND abd_discomfort <= 5),
  orthopnea integer NOT NULL DEFAULT 0 CHECK (orthopnea >= 0 AND orthopnea <= 5),
  notes text,
  origin_id text DEFAULT 'manual'::text,
  record_uid text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT symptom_log_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_symptom_log_patient_date ON public.symptom_log(patient_id, date);

-- Medication (used by web app)
CREATE TABLE IF NOT EXISTS public.medication (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  name text NOT NULL,
  class text NOT NULL,
  dosage text,
  instructions text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT medication_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_medication_patient ON public.medication(patient_id);

-- Medication Schedule (used by web app)
CREATE TABLE IF NOT EXISTS public.medication_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  med_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  time_of_day time WITHOUT time zone NOT NULL,
  repeat_daily boolean NOT NULL DEFAULT true,
  days_of_week text[],
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT medication_schedule_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT medication_schedule_med_id_fkey FOREIGN KEY (med_id) REFERENCES public.medication(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_med_schedule_patient ON public.medication_schedule(patient_id);

-- Medication Event (used by web app)
CREATE TABLE IF NOT EXISTS public.medication_event (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  med_id uuid NOT NULL,
  scheduled_ts timestamptz NOT NULL,
  status text NOT NULL,
  taken_ts timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT medication_event_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT medication_event_med_id_fkey FOREIGN KEY (med_id) REFERENCES public.medication(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_med_event_patient ON public.medication_event(patient_id);

-- Medication Preferences (used by web app)
CREATE TABLE IF NOT EXISTS public.medication_preferences (
  patient_id uuid NOT NULL,
  beta_blockers boolean DEFAULT false,
  raas_inhibitors boolean DEFAULT false,
  mras boolean DEFAULT false,
  sglt2_inhibitors boolean DEFAULT false,
  statin boolean DEFAULT false,
  notify_hour integer DEFAULT 9,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (patient_id),
  CONSTRAINT medication_preferences_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);

-- Appointments (used by web app)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  appointment_ts timestamptz NOT NULL,
  location text,
  provider text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_ts ON public.appointments(appointment_ts);

-- Appointment Alerts (used by web app)
CREATE TABLE IF NOT EXISTS public.appointment_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  offset_min integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT appointment_alerts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT appointment_alerts_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_appointment_alerts_patient ON public.appointment_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_alerts_appointment ON public.appointment_alerts(appointment_id);

-- Patient Reminder (used by web app - different from reminders)
CREATE TABLE IF NOT EXISTS public.patient_reminder (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  date timestamptz NOT NULL,
  tz_offset_min integer,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT patient_reminder_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_patient_reminder_patient ON public.patient_reminder(patient_id);

-- Admins (for admin routes)
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  is_active boolean DEFAULT true,
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);

