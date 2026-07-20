export function formatNumber(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback
  const n = Number(value)
  return Number.isNaN(n) ? fallback : n
}

export function formatDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export function formatShortDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

export function getStatusBadgeClass(status) {
  if (status === "critical") {
    return "bg-red-100 text-red-700 border border-red-200"
  }

  if (status === "warning") {
    return "bg-amber-100 text-amber-700 border border-amber-200"
  }

  return "bg-emerald-100 text-emerald-700 border border-emerald-200"
}

export function getAlertCardClass(level) {
  if (level === "critical") {
    return "border-red-200 bg-red-50"
  }

  if (level === "warning") {
    return "border-amber-200 bg-amber-50"
  }

  return "border-emerald-200 bg-emerald-50"
}

export function pickWorstStatus(alerts) {
  if (alerts.some((a) => a.level === "critical")) return "critical"
  if (alerts.some((a) => a.level === "warning")) return "warning"

  return "stable"
}

/* =========================
   Symptom helper functions
========================= */

const SYMPTOM_FIELDS = [
  ["sob_activity", "breathlessness", "shortness_of_breath"],
  ["leg_swelling", "swelling", "feet_swelling"],
  ["orthopnea", "sleeping", "sleep_flat"],
  ["cough"],
  ["abd_discomfort", "abdomen", "abdominal_discomfort"],
]

function firstNumber(row, keys) {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value)
      return Number.isNaN(numberValue) ? 0 : numberValue
    }
  }

  return 0
}

function symptomDateKey(row) {
  const value = row?.date || row?.logged_at || row?.time_ts || row?.created_at
  if (!value) return ""

  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function todayDateKey() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function daysBetween(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00`).getTime()
  const b = new Date(`${dateB}T00:00:00`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 999
  return Math.round((b - a) / 86400000)
}

function countSymptomsInRange(symptom, min, max) {
  if (!symptom) return 0

  const values = SYMPTOM_FIELDS.map((keys) => firstNumber(symptom, keys))

  return values.filter((v) => v >= min && v <= max).length
}

function getDailySymptomRows(symptoms) {
  if (!Array.isArray(symptoms)) return []

  const byDate = new Map()

  for (const row of symptoms) {
    const key = symptomDateKey(row)
    if (!key) continue

    const current = byDate.get(key)
    const rowTime = new Date(row.logged_at || row.time_ts || row.created_at || key).getTime()
    const currentTime = current
      ? new Date(current.logged_at || current.time_ts || current.created_at || key).getTime()
      : -Infinity

    if (!current || (Number.isFinite(rowTime) && rowTime >= currentTime)) {
      byDate.set(key, row)
    }
  }

  return [...byDate.entries()]
    .map(([date, row]) => ({ date, row }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function hasConsecutiveSymptomDays(
  symptoms,
  min,
  max,
  minCount,
  daysRequired = 3
) {
  const dailyRows = getDailySymptomRows(symptoms)
  let streak = 0
  let previousDate = ""

  for (const item of dailyRows) {
    const count = countSymptomsInRange(item.row, min, max)
    const isNextDay = previousDate ? daysBetween(previousDate, item.date) === 1 : true

    if (count >= minCount) {
      streak = isNextDay ? streak + 1 : 1

      if (streak >= daysRequired) {
        return true
      }
    } else {
      streak = 0
    }

    previousDate = item.date
  }

  return false
}

export function buildAlerts({
  patientId,
  summaryData,
  vitalsData,
  weeklyStatus,
  symptomLogs = [],
  demoMode = false,
}) {
  const alerts = []

  const hr = formatNumber(summaryData?.summary?.heartRate, null)

  const bpSystolic = formatNumber(
    summaryData?.summary?.bpSystolic,
    null
  )

  const bpDiastolic = formatNumber(
    summaryData?.summary?.bpDiastolic,
    null
  )

  const bpPulse = formatNumber(
    summaryData?.summary?.bpPulse,
    null
  )

  const stepsToday = formatNumber(
    summaryData?.summary?.stepsToday,
    null
  )

  const latestSpo2 =
    vitalsData?.vitals?.spo2 &&
    vitalsData.vitals.spo2.length > 0
      ? formatNumber(
          vitalsData.vitals.spo2[
            vitalsData.vitals.spo2.length - 1
          ]?.avg,
          null
        )
      : null

  const weightSeries =
    vitalsData?.vitals?.weight?.map((w) => ({
      time: w.time,
      value: Number(w.value),
    })) || []

  const latestWeight =
    weightSeries.length > 0
      ? weightSeries[weightSeries.length - 1]?.value
      : null

  /* =========================
     Demo mode
  ========================= */

  if (demoMode) {
    if (patientId === "demo-critical") {
      alerts.push({
        id: "demo-critical",
        level: "critical",
        title: "Critical BP / Pulse",
        message: "BP 182/121 mmHg, Pulse 124 bpm",
      })
    }

    if (patientId === "demo-warning") {
      alerts.push({
        id: "demo-warning",
        level: "warning",
        title: "Weight Above Baseline",
        message: "Weight increased 3.5 kg above baseline",
      })
    }
  }

  /* =========================
     BP + Pulse
  ========================= */

  if (
    bpSystolic !== null &&
    bpDiastolic !== null &&
    bpPulse !== null
  ) {
    if (
      bpSystolic >= 180 ||
      bpSystolic < 80 ||
      bpDiastolic >= 120 ||
      bpDiastolic < 50 ||
      bpPulse < 50 ||
      bpPulse > 150
    ) {
      alerts.push({
        id: "bp-critical",
        level: "critical",
        title: "Critical BP / Pulse",
        message: `BP ${bpSystolic}/${bpDiastolic} mmHg, Pulse ${bpPulse} bpm`,
      })
    } else if (
      (bpSystolic >= 140 && bpSystolic <= 179) ||
      (bpDiastolic >= 90 && bpDiastolic <= 119)
    ) {
      alerts.push({
        id: "bp-warning-high",
        level: "warning",
        title: "High Blood Pressure",
        message: `BP ${bpSystolic}/${bpDiastolic} mmHg`,
      })
    }
  }

  /* =========================
     Heart Rate
  ========================= */

  if (hr !== null) {
    if (hr < 50 || hr > 150) {
      alerts.push({
        id: "hr-critical",
        level: "critical",
        title: "Critical Heart Rate",
        message: `Heart rate ${hr} bpm`,
      })
    } else if (hr < 60 || hr > 100) {
      alerts.push({
        id: "hr-warning",
        level: "warning",
        title: "Heart Rate Out of Range",
        message: `Heart rate ${hr} bpm`,
      })
    }
  }

  /* =========================
     SpO2
  ========================= */

  if (latestSpo2 !== null) {
    if (latestSpo2 < 90) {
      alerts.push({
        id: "spo2-critical",
        level: "critical",
        title: "Low SpO₂",
        message: `SpO₂ ${latestSpo2}%`,
      })
    } else if (latestSpo2 < 95) {
      alerts.push({
        id: "spo2-warning",
        level: "warning",
        title: "Borderline SpO₂",
        message: `SpO₂ ${latestSpo2}%`,
      })
    }
  }

  /* =========================
     Weight trend
  ========================= */

  if (weightSeries.length >= 2) {
    const sorted = [...weightSeries].sort(
      (a, b) =>
        new Date(a.time).getTime() -
        new Date(b.time).getTime()
    )

    const latest = sorted[sorted.length - 1]?.value
    const previous = sorted[sorted.length - 2]?.value

    if (latest != null && previous != null) {
      const diff1 = latest - previous

      if (diff1 >= 1.5) {
        alerts.push({
          id: "weight-warning-1",
          level: "warning",
          title: "Rapid Weight Gain",
          message: `Weight increased ${diff1.toFixed(
            1
          )} kg since previous reading`,
        })
      }
    }

    if (sorted.length >= 3) {
      const diff2 =
        latest - sorted[sorted.length - 3]?.value

      if (!Number.isNaN(diff2) && diff2 >= 3) {
        alerts.push({
          id: "weight-critical-2",
          level: "critical",
          title: "Significant Weight Gain",
          message: `Weight increased ${diff2.toFixed(
            1
          )} kg over recent readings`,
        })
      }
    }

    if (sorted.length >= 6) {
      const diff5 =
        latest -
        sorted[Math.max(0, sorted.length - 6)]?.value

      if (!Number.isNaN(diff5) && diff5 >= 2) {
        alerts.push({
          id: "weight-warning-5",
          level: "warning",
          title: "Weight Gain Trend",
          message: `Weight increased ${diff5.toFixed(
            1
          )} kg over several days`,
        })
      }
    }
  }

  /* =========================
     Baseline comparison
  ========================= */

  const baselineWeight = formatNumber(
    summaryData?.summary?.baselineWeight,
    null
  )

  const baselineSystolic = formatNumber(
    summaryData?.summary?.baselineSystolic,
    null
  )

  if (
    baselineWeight !== null &&
    latestWeight !== null
  ) {
    const weightDiff =
      latestWeight - baselineWeight

    if (weightDiff >= 5) {
      alerts.push({
        id: "baseline-weight-critical",
        level: "critical",
        title: "Weight Far Above Baseline",
        message: `Weight is ${weightDiff.toFixed(
          1
        )} kg above baseline`,
      })
    } else if (weightDiff >= 3) {
      alerts.push({
        id: "baseline-weight-warning",
        level: "warning",
        title: "Weight Above Baseline",
        message: `Weight is ${weightDiff.toFixed(
          1
        )} kg above baseline`,
      })
    }
  }

  if (
    baselineSystolic !== null &&
    bpSystolic !== null
  ) {
    const sysDiff =
      bpSystolic - baselineSystolic

    if (sysDiff >= 40) {
      alerts.push({
        id: "baseline-bp-warning",
        level: "warning",
        title: "Systolic BP Above Baseline",
        message: `Systolic BP is ${sysDiff} mmHg above baseline`,
      })
    }
  }

  /* =========================
     Symptom alerts
  ========================= */

  const todayKey = todayDateKey()
  const todaySymptom = getDailySymptomRows(symptomLogs).find(
    (item) => item.date === todayKey
  )?.row

  const todayRedSymptoms = countSymptomsInRange(todaySymptom, 4, 5)

  const todayOrangeSymptoms = countSymptomsInRange(todaySymptom, 2, 3)

  const hasRedSymptomStreak =
    hasConsecutiveSymptomDays(
      symptomLogs,
      4,
      5,
      2,
      3
    )

  const hasOrangeSymptomStreak =
    hasConsecutiveSymptomDays(
      symptomLogs,
      2,
      3,
      2,
      3
    )

  if (
    todayRedSymptoms >= 3 ||
    hasRedSymptomStreak
  ) {
    alerts.push({
      id: "symptom-red-alert",
      level: "critical",
      title: "Critical Symptom Alert",
      message: todayRedSymptoms >= 3
        ? `${todayRedSymptoms} red-zone symptoms rated 4–5 today.`
        : "2 or more red-zone symptoms rated 4–5 were detected for 3 consecutive days.",
    })
  } else if (
    todayOrangeSymptoms >= 3 ||
    hasOrangeSymptomStreak
  ) {
    alerts.push({
      id: "symptom-warning-alert",
      level: "warning",
      title: "Symptom Warning",
      message: todayOrangeSymptoms >= 3
        ? `${todayOrangeSymptoms} orange-zone symptoms rated 2–3 today.`
        : "2 or more orange-zone symptoms rated 2–3 were detected for 3 consecutive days.",
    })
  }

  /* =========================
     Activity
  ========================= */

  if (
    stepsToday !== null &&
    stepsToday < 3000
  ) {
    alerts.push({
      id: "steps-warning",
      level: "warning",
      title: "Low Daily Steps",
      message: `Only ${stepsToday} steps recorded today`,
    })
  }

  /* =========================
     Missing logs
  ========================= */

  if (weeklyStatus) {
    const days = Object.values(weeklyStatus)

    const missingWeightDays =
      days.filter((d) => !d.has_weight).length

    const missingSymptomDays =
      days.filter((d) => !d.has_symptoms).length

    const missingVitalDays =
      days.filter((d) => d.has_bp === false).length

    if (missingVitalDays >= 2) {
      alerts.push({
        id: "missing-vitals",
        level: "warning",
        title: "Incomplete Vital Logs",
        message: `${missingVitalDays} days without vital log in the latest 7 days`,
      })
    }

    if (missingWeightDays >= 2) {
      alerts.push({
        id: "missing-weight",
        level: "warning",
        title: "Incomplete Weight Logs",
        message: `${missingWeightDays} days without weight log in the latest 7 days`,
      })
    }

    if (missingSymptomDays >= 2) {
      alerts.push({
        id: "missing-symptoms",
        level: "warning",
        title: "Incomplete Symptom Logs",
        message: `${missingSymptomDays} days without symptom log in the latest 7 days`,
      })
    }
  }

  /* =========================
     Stable
  ========================= */

  if (alerts.length === 0) {
    alerts.push({
      id: "stable",
      level: "stable",
      title: "Stable",
      message: "No major warning signs found",
    })
  }

  return alerts
}