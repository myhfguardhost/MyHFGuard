const DEFAULT_URL = 'https://myhfguard.onrender.com'
import { supabase } from "./supabase"

export function serverUrl() {
  const fromEnv = import.meta.env.VITE_SERVER_URL as string | undefined
  return (fromEnv && fromEnv.length > 0) ? fromEnv : DEFAULT_URL
}

export async function getAdminSummary() {
  const res = await fetch(serverUrl() + '/admin/summary')
  if (!res.ok) throw new Error('failed to fetch summary: ' + res.status)
  return res.json() as Promise<{ summary: Array<{ patientId: string, steps: any, hr: any, spo2: any }> }>
}

export type PatientSummary = {
  heartRate?: number
  bpSystolic?: number
  bpDiastolic?: number
  weightKg?: number
  nextAppointmentDate?: string
  stepsToday?: number
  distanceToday?: number
  lastSyncTs?: string | null
}

// removed implicit session-based patient id; caller must provide patientId explicitly

export async function getPatientSummary(patientId?: string) {
  const pid = patientId
  const url = pid ? `${serverUrl()}/patient/summary?patientId=${encodeURIComponent(pid)}` : `${serverUrl()}/patient/summary`
  const res = await fetch(url)
  if (!res.ok) return { summary: {} as PatientSummary }
  return res.json() as Promise<{ summary: PatientSummary }>
}

export type PatientVitals = {
  hr?: Array<{ time: string; min: number; avg: number; max: number; resting?: number }>
  spo2?: Array<{ time: string; min: number; avg: number; max: number }>
  steps?: Array<{ time: string; count: number }>
  bp?: Array<{ time: string; systolic: number; diastolic: number; pulse: number }>
  weight?: Array<{ time: string; kg: number }>
}

export async function getPatientVitals(patientId?: string, period?: "hourly" | "weekly" | "monthly") {
  const pid = patientId
  const qp = [] as string[]
  if (pid) qp.push(`patientId=${encodeURIComponent(pid)}`)
  if (period) qp.push(`period=${encodeURIComponent(period)}`)
  const url = qp.length ? `${serverUrl()}/patient/vitals?${qp.join("&")}` : `${serverUrl()}/patient/vitals`
  const res = await fetch(url)
  if (!res.ok) return { vitals: {} as PatientVitals }
  return res.json() as Promise<{ vitals: PatientVitals }>
}

export type PatientReminders = Array<{ id: string; date: string; title: string; notes?: string }>

export async function getPatientReminders(patientId?: string) {
  if (!patientId) return { reminders: [] as PatientReminders }
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })

  if (error) {
    console.error('getPatientReminders error:', error)
    return { reminders: [] as PatientReminders }
  }
  return { reminders: (data || []) as PatientReminders }
}

export async function createPatientReminder(payload: { patientId: string, title: string, date: string, notes?: string, tzOffsetMin: number }) {
  const { patientId, title, date, notes } = payload
  const { data, error } = await supabase
    .from('reminders')
    .insert([{ patient_id: patientId, title, date, notes }])
    .select()

  if (error) return { error: error.message }
  return { ok: true, data }
}

export async function updatePatientReminder(payload: { patientId: string, id: string, title: string, date: string, notes?: string, tzOffsetMin: number }) {
  const { id, title, date, notes } = payload
  const { error } = await supabase
    .from('reminders')
    .update({ title, date, notes })
    .eq('id', id)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function deletePatientReminder(patientId: string, id: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// --- New Integration Functions ---

export async function processImage(file: File, patientId: string) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patientId', patientId);

  const res = await fetch(`${serverUrl()}/api/process-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to process image');
  }

  return res.json();
}

export async function addManualEvent(data: any, patientId: string) {
  const res = await fetch(`${serverUrl()}/api/add-manual-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, patientId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add event');
  }

  return res.json();
}

export async function getHealthEvents(userId?: string) {
  const url = userId
    ? `${serverUrl()}/api/health-events?user_id=${encodeURIComponent(userId)}`
    : `${serverUrl()}/api/health-events`;

  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch events');
  }

  return res.json();
}

export type PatientProfile = {
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  date_of_birth?: string;
}

export async function getPatients() {
  const res = await fetch(`${serverUrl()}/api/admin/patients`);
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json() as Promise<{ patients: PatientProfile[] }>;
}

export async function getPatientProfile(patientId: string) {
  const res = await fetch(`${serverUrl()}/api/admin/patients?patientId=${encodeURIComponent(patientId)}`);
  if (!res.ok) throw new Error('Failed to fetch patient profile');
  const data = await res.json();
  return data.patients[0] as PatientProfile | undefined;
}

export async function getPatientInfo(patientId?: string) {
  if (!patientId) return null
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  if (error) return null
  return data
}

export async function getPatientMedications(patientId?: string) {
  if (!patientId) return { preferences: {} }
  const { data, error } = await supabase
    .from('patient_medications')
    .select('preferences')
    .eq('patient_id', patientId)
    .maybeSingle()

  if (error) {
    console.error('getPatientMedications error', error)
    return { preferences: {} }
  }
  return { preferences: data?.preferences || {} }
}

export async function savePatientMedications(payload: { patientId: string, [key: string]: any }) {
  const { patientId, ...prefs } = payload
  const { error } = await supabase
    .from('patient_medications')
    .upsert({ patient_id: patientId, preferences: prefs }, { onConflict: 'patient_id' })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function postWeightSample(payload: { patientId: string, kg: number }) {
  const { patientId, kg } = payload
  const { error } = await supabase
    .from('weight_logs')
    .insert([{ patient_id: patientId, kg }])

  if (error) return { error: error.message }
  return { ok: true }
}

export async function postSymptomLog(payload: { patientId: string, notes?: string, [key: string]: any }) {
  const { patientId, ...rest } = payload
  // Assuming table has columns matching keys or logic is handled elsewhere.
  // For simplicity, let's dump 'rest' into a JSON column or assume specific columns exist.
  // Based on SelfCheck.tsx, keys are cough, breathlessness, etc.
  const { error } = await supabase
    .from('symptom_logs')
    .insert([{ patient_id: patientId, ...rest }])

  if (error) return { error: error.message }
  return { ok: true }
}
