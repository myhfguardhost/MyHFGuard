const DEFAULT_URL = 'http://localhost:3001'

export function serverUrl() {
  const fromEnv1 = import.meta.env.VITE_SERVER_URL as string | undefined
  const fromEnv2 = import.meta.env.VITE_API_URL as string | undefined

  return (fromEnv1 && fromEnv1.length > 0)
    ? fromEnv1
    : ((fromEnv2 && fromEnv2.length > 0) ? fromEnv2 : DEFAULT_URL)
}

// Separate URL for BP image processing backend only - NOW MERGED WITH MAIN SERVER
export function bpServerUrl() {
  return serverUrl()
}

export type PatientLoginResponse = {
  success: boolean
  assignedUserId: string
  patientId: string
  user: {
    id: string
    email?: string | null
    app_metadata?: Record<string, unknown>
  }
  session: {
    access_token: string
    refresh_token: string
    expires_in?: number
    expires_at?: number
    token_type?: string
  }
}

export async function loginPatient(payload: {
  userId: string
  password: string
}) {
  let res: Response

  try {
    res = await fetch(`${serverUrl()}/api/patient/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      "Cannot reach the login server. Check your internet connection and VITE_SERVER_URL."
    )
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "The deployed backend is outdated. Redeploy the latest vitalink/server folder."
      )
    }

    throw new Error(body?.error || `Login failed (${res.status})`)
  }

  if (!body?.session?.access_token || !body?.session?.refresh_token) {
    throw new Error(
      "The login server did not return a valid session."
    )
  }

  return body as PatientLoginResponse
}

export async function getAdminSummary() {
  const res = await fetch(serverUrl() + '/admin/summary')

  if (!res.ok) {
    throw new Error('failed to fetch summary: ' + res.status)
  }

  return res.json() as Promise<{
    summary: Array<{
      patientId: string
      steps: any
      hr: any
      spo2: any
    }>
  }>
}

export type PatientSummary = {
  heartRate?: number
  bpSystolic?: number
  bpDiastolic?: number
  bpPulse?: number
  weightKg?: number
  nextAppointmentDate?: string
  stepsToday?: number
  distanceToday?: number
  lastSyncTs?: string
}

// Caller must provide patientId explicitly.
export async function getPatientSummary(patientId?: string) {
  const pid = patientId

  const url = pid
    ? `${serverUrl()}/patient/summary?patientId=${encodeURIComponent(pid)}`
    : `${serverUrl()}/patient/summary`

  const res = await fetch(url)

  if (!res.ok) {
    return {
      summary: {} as PatientSummary,
    }
  }

  return res.json() as Promise<{
    summary: PatientSummary
  }>
}

export type PatientVitals = {
  hr?: Array<{
    time: string
    min: number
    avg: number
    max: number
  }>
  spo2?: Array<{
    time: string
    min: number
    avg: number
    max: number
  }>
  steps?: Array<{
    time: string
    count: number
  }>
  bp?: Array<{
    time: string
    systolic: number
    diastolic: number
    pulse: number
  }>
  weight?: Array<{
    time: string
    kg: number
  }>
}

export async function getPatientVitals(
  patientId?: string,
  period?: "hourly" | "weekly" | "monthly",
  date?: string,
  tzOffsetMin?: number
) {
  const pid = patientId
  const qp: string[] = []

  if (pid) {
    qp.push(`patientId=${encodeURIComponent(pid)}`)
  }

  if (period) {
    qp.push(`period=${encodeURIComponent(period)}`)
  }

  if (date) {
    qp.push(`date=${encodeURIComponent(date)}`)
  }

  if (typeof tzOffsetMin === "number") {
    qp.push(
      `tzOffsetMin=${encodeURIComponent(String(tzOffsetMin))}`
    )
  }

  const url = qp.length
    ? `${serverUrl()}/patient/vitals?${qp.join("&")}`
    : `${serverUrl()}/patient/vitals`

  const res = await fetch(url)

  if (!res.ok) {
    return {
      vitals: {} as PatientVitals,
    }
  }

  const data = await res.json()

  return {
    vitals: (data.vitals || data) as PatientVitals,
  }
}

export type PatientReminders = Array<{
  id: string
  date: string
  title: string
  notes?: string
}>

export async function getPatientReminders(patientId?: string) {
  const pid = patientId

  const url = pid
    ? `${serverUrl()}/patient/reminders?patientId=${encodeURIComponent(pid)}`
    : `${serverUrl()}/patient/reminders`

  const res = await fetch(url)

  if (!res.ok) {
    return {
      reminders: [] as PatientReminders,
    }
  }

  return res.json() as Promise<{
    reminders: PatientReminders
  }>
}

export async function processImage(
  file: File,
  patientId: string
) {
  const formData = new FormData()

  formData.append('image', file)
  formData.append('patientId', patientId)

  const res = await fetch(
    `${serverUrl()}/api/process-image`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!res.ok) {
    const error = await res.json()

    throw new Error(
      error.error || 'Failed to process image'
    )
  }

  return res.json()
}

export async function addManualEvent(
  data: any,
  patientId: string
) {
  const res = await fetch(
    `${serverUrl()}/api/add-manual-event`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        patientId,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.json()

    throw new Error(
      error.error || 'Failed to add event'
    )
  }

  return res.json()
}

export async function getHealthEvents(userId?: string) {
  const url = userId
    ? `${serverUrl()}/api/health-events?user_id=${encodeURIComponent(userId)}`
    : `${serverUrl()}/api/health-events`

  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json()

    throw new Error(
      error.error || 'Failed to fetch events'
    )
  }

  return res.json()
}

export type PatientProfile = {
  patient_id: string
  assigned_user_id?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
  date_of_birth?: string | null
  profile_completed?: boolean
  target_steps?: number
}

async function adminAuthHeaders() {
  const { supabase } = await import("@/lib/supabase")
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export async function getPatients() {
  const res = await fetch(
    `${serverUrl()}/api/admin/patients`,
    {
      headers: await adminAuthHeaders(),
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch patients')
  }

  return res.json() as Promise<{
    patients: PatientProfile[]
  }>
}

export async function createAdminPatientAccount(payload: {
  userId: string
  password: string
}) {
  let res: Response

  try {
    res = await fetch(
      `${serverUrl()}/api/admin/patients`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await adminAuthHeaders()),
        },
        body: JSON.stringify(payload),
      }
    )
  } catch {
    throw new Error(
      "Cannot reach the admin backend. Redeploy the latest server and check VITE_SERVER_URL."
    )
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "The deployed backend is outdated. Redeploy the latest vitalink/server folder on Render."
      )
    }

    if (res.status === 401) {
      throw new Error(
        "Your admin login session has expired. Sign in again."
      )
    }

    if (res.status === 403) {
      throw new Error(
        "This account is not marked as admin in Supabase App Metadata."
      )
    }

    throw new Error(
      body?.error ||
        `Failed to create patient account (${res.status})`
    )
  }

  return body as {
    patient: PatientProfile
  }
}

export async function backfillPatientUserIds() {
  let res: Response

  try {
    res = await fetch(
      `${serverUrl()}/api/admin/patients/backfill-user-ids`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await adminAuthHeaders()),
        },
        body: JSON.stringify({}),
      }
    )
  } catch {
    throw new Error(
      "Cannot reach the admin backend. Redeploy the latest server and check VITE_SERVER_URL."
    )
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "The deployed backend is outdated. Redeploy the latest vitalink/server folder on Render."
      )
    }

    if (res.status === 401) {
      throw new Error(
        "Your admin login session has expired. Sign in again."
      )
    }

    if (res.status === 403) {
      throw new Error(
        "This account is not marked as admin in Supabase App Metadata."
      )
    }

    throw new Error(
      body?.error ||
        `Failed to assign User IDs (${res.status})`
    )
  }

  return body as {
    ok: boolean
    processed: number
    updated: number
    newlyAssigned: number
    loginEmailsChanged: number
    patients: Array<{
      patientId: string
      user_id: string
      assigned_user_id: string
      newly_assigned: boolean
      auth_email_changed?: boolean
    }>
    errors: Array<{
      patientId: string
      error: string
    }>
  }
}

export async function updateAdminPatientTargetSteps(
  patientId: string,
  targetSteps: number
) {
  let res: Response

  try {
    res = await fetch(
      `${serverUrl()}/api/admin/patients/${encodeURIComponent(
        patientId
      )}/target-steps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await adminAuthHeaders()),
        },
        body: JSON.stringify({
          targetSteps,
        }),
      }
    )
  } catch {
    throw new Error(
      "Cannot reach the admin backend. Redeploy the latest server and check VITE_SERVER_URL."
    )
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "The deployed backend is outdated or the patient profile is missing. Redeploy the latest server."
      )
    }

    if (res.status === 401) {
      throw new Error(
        "Your admin login session has expired. Sign in again."
      )
    }

    if (res.status === 403) {
      throw new Error(
        "This account is not marked as admin in Supabase App Metadata."
      )
    }

    throw new Error(
      body?.error ||
        `Failed to update target steps (${res.status})`
    )
  }

  return body as {
    patientId: string
    targetSteps: number
  }
}

export async function getPatientProfile(
  patientId: string
) {
  const res = await fetch(
    `${serverUrl()}/api/admin/patients?patientId=${encodeURIComponent(
      patientId
    )}`,
    {
      headers: await adminAuthHeaders(),
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch patient profile')
  }

  const data = await res.json()

  return data.patients[0] as PatientProfile | undefined
}

export async function createPatientReminder(payload: {
  patientId: string
  title: string
  date: string
  notes?: string
  tzOffsetMin?: number
}) {
  const res = await fetch(
    `${serverUrl()}/patient/reminders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const body = await res.json()

  if (!res.ok) {
    return body
  }

  return body as {
    reminder: {
      id: string
      date: string
      title: string
      notes?: string
    }
  }
}

export async function deletePatientReminder(
  patientId: string,
  id: string
) {
  const url =
    `${serverUrl()}/patient/reminders/` +
    `${encodeURIComponent(id)}?patientId=` +
    `${encodeURIComponent(patientId)}`

  const res = await fetch(url, {
    method: 'DELETE',
  })

  return res.json() as Promise<{
    ok: boolean
    id: string
  }>
}

export async function updatePatientReminder(payload: {
  patientId: string
  id: string
  title?: string
  date?: string
  notes?: string
  tzOffsetMin?: number
}) {
  const url = `${serverUrl()}/patient/reminders-edit`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await res.json()

  if (!res.ok) {
    return body
  }

  return body as {
    reminder: {
      id: string
      date: string
      title: string
      notes?: string
    }
  }
}

export type MedicationPreferences = {
  beta_blockers: boolean
  raas_inhibitors: boolean
  mras: boolean
  sglt2_inhibitors: boolean
  statin: boolean
  notify_hour: number
}

export async function getPatientMedications(
  patientId?: string
) {
  const pid = patientId

  const url = pid
    ? `${serverUrl()}/patient/medications?patientId=${encodeURIComponent(pid)}`
    : `${serverUrl()}/patient/medications`

  const res = await fetch(url)

  if (!res.ok) {
    return {
      preferences: {
        beta_blockers: false,
        raas_inhibitors: false,
        mras: false,
        sglt2_inhibitors: false,
        statin: false,
        notify_hour: 9,
      } as MedicationPreferences,
    }
  }

  return res.json() as Promise<{
    preferences: MedicationPreferences
  }>
}

export async function savePatientMedications(
  payload: {
    patientId: string
  } & Partial<MedicationPreferences>
) {
  const res = await fetch(
    `${serverUrl()}/patient/medications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  return res.json() as Promise<{
    ok: boolean
  }>
}

export type PatientInfo = {
  patient?: {
    patient_id: string
    first_name?: string
    last_name?: string
    dob?: string
  }
  devicesCount?: number
  devices?: any[]
  warnings?: string[]
}

export async function getPatientInfo(
  patientId?: string
) {
  const pid = patientId

  const url = pid
    ? `${serverUrl()}/admin/patient-info?patientId=${encodeURIComponent(pid)}`
    : `${serverUrl()}/admin/patient-info`

  const res = await fetch(url)

  if (!res.ok) {
    return {
      patient: undefined,
      devicesCount: 0,
      warnings: [],
    } as PatientInfo
  }

  return res.json() as Promise<PatientInfo>
}

export async function postWeightSample(payload: {
  patientId: string
  kg: number
  timeTs?: string
  originId?: string
  deviceId?: string
  tzOffsetMin?: number
}) {
  const body = Array.isArray(payload)
    ? payload
    : [
        {
          patientId: payload.patientId,
          kg: payload.kg,
          timeTs:
            payload.timeTs || new Date().toISOString(),
          originId:
            payload.originId || 'manual',
          deviceId:
            payload.deviceId || 'selfcheck',
          tzOffsetMin:
            payload.tzOffsetMin ??
            (0 - new Date().getTimezoneOffset()),
          recordUid:
            `${payload.patientId}|${Date.now()}|` +
            `${Math.random().toString(36).slice(2)}`,
        },
      ]

  const res = await fetch(
    `${serverUrl()}/ingest/weight-samples`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  return res.json()
}

export async function postSymptomLog(payload: {
  patientId: string
  timeTs?: string
  cough?: number
  breathlessness?: number
  swelling?: number
  weightGain?: number
  abdomen?: number
  sleeping?: number
  notes?: string
  tzOffsetMin?: number
}) {
  const body = {
    patientId: payload.patientId,
    timeTs:
      payload.timeTs || new Date().toISOString(),
    cough:
      payload.cough ?? 0,
    breathlessness:
      payload.breathlessness ?? 0,
    swelling:
      payload.swelling ?? 0,
    weightGain: 0,
    abdomen:
      payload.abdomen ?? 0,
    sleeping:
      payload.sleeping ?? 0,
    notes:
      payload.notes || '',
    tzOffsetMin:
      payload.tzOffsetMin ??
      (0 - new Date().getTimezoneOffset()),
    originId: 'manual',
    recordUid:
      `${payload.patientId}|${Date.now()}|` +
      `${Math.random().toString(36).slice(2)}`,
  }

  console.log('[postSymptomLog] body', body)

  const res = await fetch(
    `${serverUrl()}/ingest/symptom-log`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  return res.json()
}

export async function getDailyStatus(
  patientId: string,
  date: string
) {
  const res = await fetch(
    `${serverUrl()}/patient/daily-status?patientId=` +
      `${encodeURIComponent(patientId)}&date=` +
      `${encodeURIComponent(date)}`
  )

  if (!res.ok) {
    return {
      has_weight: false,
      has_bp: false,
      has_symptoms: false,
    }
  }

  return res.json() as Promise<{
    has_weight: boolean
    has_bp: boolean
    has_symptoms: boolean
  }>
}

export async function getWeeklyStatus(
  patientId: string,
  endDate?: string
) {
  const url =
    `${serverUrl()}/patient/weekly-status?patientId=` +
    `${encodeURIComponent(patientId)}` +
    `${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ''}`

  const res = await fetch(url)

  if (!res.ok) {
    return {}
  }

  return res.json() as Promise<
    Record<
      string,
      {
        has_weight: boolean
        has_symptoms: boolean
        has_bp?: boolean
      }
    >
  >
}

export async function sendSymptomMessage(
  message: string,
  patientId: string
) {
  const res = await fetch(
    `${serverUrl()}/api/chat/symptoms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        patientId,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.json()

    throw new Error(
      error.error || 'Failed to get response'
    )
  }

  return res.json() as Promise<{
    response: string
    timestamp: string
  }>
}

export async function collectSmartbandData(
  patientId: string
) {
  const res = await fetch(
    `${serverUrl()}/api/collect-data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.json()

    throw new Error(
      error.error || "Failed to collect data"
    )
  }

  return res.json()
}

export const postWaterSalt = async (data: any) => {
  const res = await fetch(
    `${serverUrl()}/water-salt`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )

  if (!res.ok) {
    throw new Error("Failed")
  }

  return res.json()
}

export async function getWaterSaltLogs(
  patientId: string,
  limit = 14
) {
  const res = await fetch(
    `${serverUrl()}/water-salt?patientId=` +
      `${encodeURIComponent(patientId)}&limit=` +
      `${encodeURIComponent(String(limit))}`
  )

  if (!res.ok) {
    throw new Error(
      "Failed to load water and salt logs"
    )
  }

  return res.json() as Promise<{
    logs: Array<{
      id?: string
      patient_id: string
      water_intake: number
      salt_intake: number
      date: string
    }>
  }>
}

export async function processWeightImage(
  file: File,
  patientId: string
) {
  const formData = new FormData()

  formData.append("image", file)
  formData.append("patientId", patientId)

  const response = await fetch(
    `${serverUrl()}/api/ocr/weight`,
    {
      method: "POST",
      body: formData,
    }
  )

  const text = await response.text()

  let data: any = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      text || "Server returned invalid JSON"
    )
  }

  if (!response.ok) {
    throw new Error(
      data?.details ||
        data?.error ||
        "Weight OCR processing failed."
    )
  }

  return data
}

/**
 * Complete information returned for the Admin Reports page.
 *
 * exerciseGoals contains the patient's weekly exercise target
 * and their achievement rating from 1 to 5.
 */
export type AdminPatientFullData = {
  patientId: string

  range?: {
    startDate?: string
    endDate?: string
  }

  patient?: any
  profile?: any
  devices?: any[]
  deviceSync?: any[]
  summary?: any

  vitals?: {
    hr?: any[]
    spo2?: any[]
    steps?: any[]
    distance?: any[]
    bp?: any[]
    weight?: any[]
    weightSamples?: any[]
  }

  logs?: {
    symptoms?: any[]
    waterSalt?: any[]
    medications?: any[]
    reminders?: any[]
  }

  exerciseGoals?: Array<{
    id?: string
    patient_id: string
    week_key: string
    goal: string
    achievement_rating?: number | null
    created_at?: string | null
    updated_at?: string | null
  }>

  errors?: Record<string, string>
}

export async function getAdminPatientFullData(
  patientId: string,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams({
    patientId,
  })

  if (startDate) {
    params.set("startDate", startDate)
  }

  if (endDate) {
    params.set("endDate", endDate)
  }

  const res = await fetch(
    `${serverUrl()}/api/admin/patient-full-data?${params.toString()}`,
    {
      headers: await adminAuthHeaders(),
    }
  )

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({}))

    throw new Error(
      body?.details ||
        body?.error ||
        "Failed to fetch full patient data"
    )
  }

  return res.json() as Promise<AdminPatientFullData>
}