import React, { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Siren,
  FileBarChart2,
  Settings,
  TriangleAlert,
  CircleAlert,
  CircleCheckBig,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  HeartPulse,
  Waves,
  Footprints,
  Mail,
  Bell,
  RefreshCw,
  Scale,
  Stethoscope,
  UserRound,
  Loader2,
} from "lucide-react"
import { serverUrl } from "@/lib/api"
import { toast } from "sonner"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"

function formatNumber(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback
  const n = Number(value)
  return Number.isNaN(n) ? fallback : n
}

function formatDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function formatShortDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

function getStatusBadgeClass(status) {
  if (status === "critical") {
    return "bg-red-100 text-red-700 border border-red-200"
  }
  if (status === "warning") {
    return "bg-amber-100 text-amber-700 border border-amber-200"
  }
  return "bg-emerald-100 text-emerald-700 border border-emerald-200"
}

function getAlertCardClass(level) {
  if (level === "critical") {
    return "border-red-200 bg-red-50"
  }
  if (level === "warning") {
    return "border-amber-200 bg-amber-50"
  }
  return "border-emerald-200 bg-emerald-50"
}

function pickWorstStatus(alerts) {
  if (alerts.some((a) => a.level === "critical")) return "critical"
  if (alerts.some((a) => a.level === "warning")) return "warning"
  return "stable"
}

function buildAlerts({ summaryData, vitalsData, weeklyStatus }) {
  const alerts = []

  const hr = formatNumber(summaryData?.summary?.heartRate, null)
  const bpSystolic = formatNumber(summaryData?.summary?.bpSystolic, null)
  const bpDiastolic = formatNumber(summaryData?.summary?.bpDiastolic, null)
  const bpPulse = formatNumber(summaryData?.summary?.bpPulse, null)
  const stepsToday = formatNumber(summaryData?.summary?.stepsToday, null)

  const latestSpo2 =
    vitalsData?.vitals?.spo2 && vitalsData.vitals.spo2.length > 0
      ? formatNumber(vitalsData.vitals.spo2[vitalsData.vitals.spo2.length - 1]?.avg, null)
      : null

  const weightSeries =
    vitalsData?.vitals?.weight?.map((w) => ({
      time: w.time,
      value: Number(w.value),
    })) || []

  // BP + pulse alert logic
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
      bpPulse > 120
    ) {
      alerts.push({
        id: `bp-critical`,
        level: "critical",
        title: "Critical BP / Pulse",
        message: `BP ${bpSystolic}/${bpDiastolic} mmHg, Pulse ${bpPulse} bpm`,
      })
    } else if (
      (bpSystolic >= 140 && bpSystolic <= 179) ||
      (bpDiastolic >= 90 && bpDiastolic <= 119)
    ) {
      alerts.push({
        id: `bp-warning-high`,
        level: "warning",
        title: "High Blood Pressure",
        message: `BP ${bpSystolic}/${bpDiastolic} mmHg`,
      })
    } else if (
      (bpSystolic >= 121 && bpSystolic <= 139) ||
      (bpDiastolic >= 80 && bpDiastolic <= 89)
    ) {
      alerts.push({
        id: `bp-warning-elevated`,
        level: "warning",
        title: "Elevated Blood Pressure",
        message: `BP ${bpSystolic}/${bpDiastolic} mmHg`,
      })
    }
  }

  // HR alert logic
  if (hr !== null) {
    if (hr < 50 || hr > 120) {
      alerts.push({
        id: `hr-critical`,
        level: "critical",
        title: "Critical Heart Rate",
        message: `Heart rate ${hr} bpm`,
      })
    } else if (hr < 60 || hr > 100) {
      alerts.push({
        id: `hr-warning`,
        level: "warning",
        title: "Heart Rate Out of Range",
        message: `Heart rate ${hr} bpm`,
      })
    }
  }

  // SpO2 alert logic
  if (latestSpo2 !== null) {
    if (latestSpo2 < 90) {
      alerts.push({
        id: `spo2-critical`,
        level: "critical",
        title: "Low SpO₂",
        message: `SpO₂ ${latestSpo2}%`,
      })
    } else if (latestSpo2 < 95) {
      alerts.push({
        id: `spo2-warning`,
        level: "warning",
        title: "Borderline SpO₂",
        message: `SpO₂ ${latestSpo2}%`,
      })
    }
  }

  // Weight trend logic
  if (weightSeries.length >= 2) {
    const sorted = [...weightSeries].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    )

    const latest = sorted[sorted.length - 1]?.value
    const previous = sorted[sorted.length - 2]?.value

    if (latest != null && previous != null) {
      const diff1 = latest - previous
      if (diff1 >= 1.5) {
        alerts.push({
          id: `weight-warning-1`,
          level: "warning",
          title: "Rapid Weight Gain",
          message: `Weight increased ${diff1.toFixed(1)} kg since previous reading`,
        })
      }
    }

    if (sorted.length >= 3) {
      const diff2 = latest - sorted[sorted.length - 3]?.value
      if (!Number.isNaN(diff2) && diff2 >= 3) {
        alerts.push({
          id: `weight-critical-2`,
          level: "critical",
          title: "Significant Weight Gain",
          message: `Weight increased ${diff2.toFixed(1)} kg over recent readings`,
        })
      }
    }

    if (sorted.length >= 6) {
      const diff5 = latest - sorted[Math.max(0, sorted.length - 6)]?.value
      if (!Number.isNaN(diff5) && diff5 >= 2) {
        alerts.push({
          id: `weight-warning-5`,
          level: "warning",
          title: "Weight Gain Trend",
          message: `Weight increased ${diff5.toFixed(1)} kg over several days`,
        })
      }
    }
  }

  // Low activity
  if (stepsToday !== null && stepsToday < 3000) {
    alerts.push({
      id: `steps-warning`,
      level: "warning",
      title: "Low Daily Steps",
      message: `Only ${stepsToday} steps recorded today`,
    })
  }

  // Missing self-check logs
  if (weeklyStatus) {
    const days = Object.values(weeklyStatus)
    const missingWeightDays = days.filter((d) => !d.has_weight).length
    const missingSymptomDays = days.filter((d) => !d.has_symptoms).length

    if (missingWeightDays >= 4) {
      alerts.push({
        id: `missing-weight`,
        level: "warning",
        title: "Incomplete Weight Logs",
        message: `${missingWeightDays} days without weight log this week`,
      })
    }

    if (missingSymptomDays >= 4) {
      alerts.push({
        id: `missing-symptoms`,
        level: "warning",
        title: "Incomplete Symptom Logs",
        message: `${missingSymptomDays} days without symptom log this week`,
      })
    }
  }

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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const exportRef = useRef(null)

  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([])
  const [showExportBox, setShowExportBox] = useState(false)

  const API = serverUrl()

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)
        setError("")

        const p = await fetch(`${API}/api/admin/patients`)
        if (!p.ok) {
          const t = await p.text()
          throw new Error(`patients ${p.status} ${p.statusText} ${t}`)
        }

        const pr = await p.json()
        const patientRows = pr.patients || []
        setUsers(patientRows)

        const detailed = await Promise.all(
          patientRows.map(async (patient) => {
            const patientId = patient.patient_id

            const [patientInfoRes, summaryRes, vitalsRes, weeklyStatusRes] =
              await Promise.all([
                fetch(`${API}/admin/patient-info?patientId=${patientId}`).then((r) =>
                  r.ok ? r.json() : null
                ),
                fetch(`${API}/patient/summary?patientId=${patientId}`).then((r) =>
                  r.ok ? r.json() : null
                ),
                fetch(`${API}/patient/vitals?patientId=${patientId}&period=weekly`).then((r) =>
                  r.ok ? r.json() : null
                ),
                fetch(`${API}/patient/weekly-status?patientId=${patientId}`).then((r) =>
                  r.ok ? r.json() : null
                ),
              ])

            const alerts = buildAlerts({
              summaryData: summaryRes,
              vitalsData: vitalsRes,
              weeklyStatus: weeklyStatusRes,
            })

            return {
              patientId,
              patientInfo: patientInfoRes,
              summaryData: summaryRes,
              vitalsData: vitalsRes,
              weeklyStatus: weeklyStatusRes,
              alerts,
              status: pickWorstStatus(alerts),
            }
          })
        )

        detailed.sort((a, b) => {
          const rank = { critical: 0, warning: 1, stable: 2 }
          return rank[a.status] - rank[b.status]
        })

        setSummary(detailed)
      } catch (e) {
        console.error("[AdminDashboard] fetchAll error", e)
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [API])

  const dashboardData = useMemo(() => {
    const totalPatients = users.length
    const activePatients = summary.length

    let avgSpo2 = 0
    let avgHr = 0
    let avgSteps = 0

    let spo2Count = 0
    let hrCount = 0
    let stepsCount = 0

    let stable = 0
    let warning = 0
    let critical = 0

    const alerts = []

    summary.forEach((item) => {
      const latestSpo2 =
        item.vitalsData?.vitals?.spo2 && item.vitalsData.vitals.spo2.length > 0
          ? Number(item.vitalsData.vitals.spo2[item.vitalsData.vitals.spo2.length - 1]?.avg)
          : null

      const hr = Number(item.summaryData?.summary?.heartRate)
      const steps = Number(item.summaryData?.summary?.stepsToday)

      if (!Number.isNaN(latestSpo2) && latestSpo2 > 0) {
        avgSpo2 += latestSpo2
        spo2Count++
      }

      if (!Number.isNaN(hr) && hr > 0) {
        avgHr += hr
        hrCount++
      }

      if (!Number.isNaN(steps) && steps >= 0) {
        avgSteps += steps
        stepsCount++
      }

      if (item.status === "critical") critical++
      else if (item.status === "warning") warning++
      else stable++

      const primaryAlert = item.alerts.find((a) => a.level !== "stable") || item.alerts[0]

      if (
        primaryAlert &&
        !acknowledgedAlerts.includes(`${item.patientId}-${primaryAlert.id}`)
      ) {
        alerts.push({
          id: `${item.patientId}-${primaryAlert.id}`,
          level: primaryAlert.level,
          title: primaryAlert.title,
          patientId: item.patientId,
          message: primaryAlert.message,
        })
      }
    })

    return {
      totalPatients,
      activePatients,
      newThisMonth: users.length,
      avgSpo2: spo2Count ? Math.round(avgSpo2 / spo2Count) : "-",
      avgHr: hrCount ? Math.round(avgHr / hrCount) : "-",
      avgSteps: stepsCount ? Math.round(avgSteps / stepsCount) : "-",
      stable,
      warning,
      critical,
      alerts,
    }
  }, [users, summary, acknowledgedAlerts])

  const exportExcel = () => {
    const rows = summary.map((item) => {
      const patient = item.patientInfo?.patient || {}
      const s = item.summaryData?.summary || {}
      const latestSpo2 =
        item.vitalsData?.vitals?.spo2 && item.vitalsData.vitals.spo2.length > 0
          ? item.vitalsData.vitals.spo2[item.vitalsData.vitals.spo2.length - 1]?.avg
          : ""

      const latestWeight =
        item.vitalsData?.vitals?.weight && item.vitalsData.vitals.weight.length > 0
          ? item.vitalsData.vitals.weight[item.vitalsData.vitals.weight.length - 1]?.value
          : ""

      return {
        "Patient ID": item.patientId,
        "First Name": patient.first_name || "",
        "Last Name": patient.last_name || "",
        "Date of Birth": patient.dob || "",
        "Heart Rate": s.heartRate ?? "",
        "BP Systolic": s.bpSystolic ?? "",
        "BP Diastolic": s.bpDiastolic ?? "",
        "Pulse": s.bpPulse ?? "",
        "Steps Today": s.stepsToday ?? "",
        "Distance Today": s.distanceToday ?? "",
        "Latest SpO2": latestSpo2 ?? "",
        "Latest Weight": latestWeight ?? "",
        Status: item.status,
        "Primary Alert": item.alerts?.[0]?.title || "",
        "Alert Detail": item.alerts?.[0]?.message || "",
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Admin Dashboard")
    XLSX.writeFile(wb, "admin_dashboard_report.xlsx")
    toast.success("Excel file downloaded")
  }

  const exportPDF = async () => {
    try {
      if (!exportRef.current) return

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#eef2f7",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "pt", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 40
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 20

      pdf.setFontSize(16)
      pdf.text("MyHFGuard Admin Dashboard Report", 20, 20)
      pdf.addImage(imgData, "PNG", 20, 40, imgWidth, imgHeight)
      heightLeft -= pageHeight - 40

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 40
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save("admin_dashboard_report.pdf")
      toast.success("PDF downloaded")
    } catch (e) {
      console.error(e)
      toast.error("Failed to export PDF")
    }
  }

  const acknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts((prev) => [...prev, alertId])
    toast.success("Alert acknowledged")
  }

  const sendAlertEmail = (alert) => {
    const row = summary.find((x) => x.patientId === alert.patientId)
    const patient = row?.patientInfo?.patient || {}

    const patientName =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || alert.patientId

    const subject = encodeURIComponent(`MyHFGuard Alert - ${patientName}`)
    const body = encodeURIComponent(
      [
        `Patient: ${patientName}`,
        `Patient ID: ${alert.patientId}`,
        `Alert Level: ${alert.level.toUpperCase()}`,
        `Alert: ${alert.title}`,
        `Details: ${alert.message}`,
      ].join("\n")
    )

    window.location.href = `mailto:?subject=${subject}&body=${body}`
    toast.success(`Email draft opened for patient ${alert.patientId}`)
  }

  const goToPatient = (patientId) => {
    navigate(`/admin/patient/${patientId}`)
  }

  const alertsToShow = dashboardData.alerts.slice(0, 6)

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen" ref={exportRef}>
        <aside className="hidden lg:flex w-56 flex-col bg-[#1f5fa8] text-white">
          <div className="px-5 py-5 border-b border-white/15">
            <div className="text-2xl font-bold">MyHFGuard</div>
            <p className="text-sm text-blue-100 mt-1">Admin Dashboard</p>
          </div>

          <nav className="p-4 space-y-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg bg-[#23c6e8] px-4 py-3 font-medium text-white"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              to="/admin/patients"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10"
            >
              <Users size={18} />
              Patient List
            </Link>

            <button
              onClick={() =>
                document.getElementById("recent-alerts")?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <Siren size={18} />
              Alert Center
            </button>

            <button
              onClick={() =>
                document.getElementById("analytics-reports")?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <FileBarChart2 size={18} />
              Analytics & Reports
            </button>

            <button
              onClick={() => toast.info("Account Settings page not built yet")}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <Settings size={18} />
              Account Settings
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-5">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">
                  Monitor alerts, patient status, clinical data, and reports.
                </p>
              </div>

              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 font-semibold hover:bg-slate-50 shadow-sm"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

                <button
                  onClick={() => setShowExportBox((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-white font-semibold hover:bg-slate-600 shadow-sm"
                >
                  <Download size={16} />
                  Export Data
                </button>

                {showExportBox && (
                  <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <h3 className="font-semibold text-slate-900">Export Data</h3>
                    <p className="text-sm text-slate-500 mb-3">Choose export format</p>

                    <div className="space-y-2">
                      <button
                        onClick={exportPDF}
                        className="w-full flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-medium hover:bg-red-400"
                      >
                        <FileText size={16} />
                        Download as PDF
                      </button>

                      <button
                        onClick={exportExcel}
                        className="w-full flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-500"
                      >
                        <FileSpreadsheet size={16} />
                        Download as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm text-slate-700 flex items-center gap-3">
                <Loader2 className="animate-spin" size={18} />
                Loading dashboard...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <section
                    id="recent-alerts"
                    className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-slate-800">Recent Alerts</h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Bell size={14} />
                        {alertsToShow.length} alerts
                      </div>
                    </div>

                    <div className="space-y-3">
                      {alertsToShow.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                          No active alerts found.
                        </div>
                      ) : (
                        alertsToShow.map((alert) => (
                          <div
                            key={alert.id}
                            className={`rounded-lg border p-3 ${
                              alert.level === "critical"
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {alert.level === "critical" ? (
                                <TriangleAlert className="text-red-500 mt-0.5" size={16} />
                              ) : (
                                <CircleAlert className="text-amber-500 mt-0.5" size={16} />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-800">
                                  {alert.title}: {alert.patientId}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                              >
                                Acknowledge
                              </button>

                              <button
                                onClick={() => goToPatient(alert.patientId)}
                                className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-400"
                              >
                                View Profile
                              </button>

                              <button
                                onClick={() => sendAlertEmail(alert)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                              >
                                <Mail size={12} />
                                Send Email
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-800 mb-3">Overall Status</h2>

                    <div className="flex flex-col items-center">
                      <div className="relative h-40 w-40 rounded-full bg-[conic-gradient(#22c55e_0deg,#22c55e_220deg,#f59e0b_220deg,#f59e0b_300deg,#ef4444_300deg,#ef4444_360deg)] p-4">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
                          <div>
                            <p className="text-3xl font-bold text-slate-800">
                              {dashboardData.totalPatients}
                            </p>
                            <p className="text-sm text-slate-500">Patients</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                        <div className="rounded-lg bg-emerald-50 p-3 text-center">
                          <p className="font-bold text-emerald-600">{dashboardData.stable}</p>
                          <p className="text-xs text-slate-500">Stable</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-3 text-center">
                          <p className="font-bold text-amber-600">{dashboardData.warning}</p>
                          <p className="text-xs text-slate-500">Warning</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-3 text-center">
                          <p className="font-bold text-red-600">{dashboardData.critical}</p>
                          <p className="text-xs text-slate-500">Critical</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-800 mb-3">Patient Summary</h2>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">Total Patients</span>
                        <span className="font-bold text-slate-900">{dashboardData.totalPatients}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">New This Month</span>
                        <span className="font-bold text-slate-900">{dashboardData.newThisMonth}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">Active Patients</span>
                        <span className="font-bold text-slate-900">{dashboardData.activePatients}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div id="analytics-reports" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Waves className="text-cyan-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg SpO₂</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgSpo2}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <HeartPulse className="text-rose-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg Heart Rate</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgHr} bpm</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Footprints className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg Daily Steps</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgSteps}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <section className="lg:col-span-5 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={16} className="text-cyan-600" />
                      <h2 className="font-semibold text-slate-800">Activity Feed</h2>
                    </div>

                    <div className="space-y-2">
                      {summary.slice(0, 5).map((item) => {
                        const patient = item.patientInfo?.patient || {}
                        const name =
                          `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                          item.patientId

                        return (
                          <div
                            key={item.patientId}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">{name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Latest status: {item.status}
                              </p>
                            </div>
                            <span className="text-xs text-slate-400">recently</span>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-slate-800">Patient Monitoring Table</h2>
                      <span className="text-xs text-slate-500">Click row to view profile</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="px-3 py-3 text-left">Patient</th>
                            <th className="px-3 py-3 text-left">BP</th>
                            <th className="px-3 py-3 text-left">Pulse</th>
                            <th className="px-3 py-3 text-left">Weight</th>
                            <th className="px-3 py-3 text-left">Steps</th>
                            <th className="px-3 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.map((item) => {
                            const patient = item.patientInfo?.patient || {}
                            const name =
                              `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                              item.patientId

                            const s = item.summaryData?.summary || {}
                            const latestWeight =
                              item.vitalsData?.vitals?.weight &&
                              item.vitalsData.vitals.weight.length > 0
                                ? item.vitalsData.vitals.weight[item.vitalsData.vitals.weight.length - 1]?.value
                                : "-"

                            return (
                              <tr
                                key={item.patientId}
                                className="border-t border-slate-200 cursor-pointer hover:bg-slate-50"
                                onClick={() => goToPatient(item.patientId)}
                              >
                                <td className="px-3 py-3">
                                  <div className="font-medium text-slate-800">{name}</div>
                                  <div className="text-xs text-slate-500">{item.patientId}</div>
                                </td>

                                <td className="px-3 py-3 text-slate-600">
                                  {s.bpSystolic && s.bpDiastolic
                                    ? `${s.bpSystolic}/${s.bpDiastolic}`
                                    : "-"}
                                </td>

                                <td className="px-3 py-3 text-slate-600">
                                  {s.bpPulse ?? "-"}
                                </td>

                                <td className="px-3 py-3 text-slate-600">
                                  {latestWeight !== "-" ? `${latestWeight} kg` : "-"}
                                </td>

                                <td className="px-3 py-3 text-slate-600">
                                  {s.stepsToday ?? "-"}
                                </td>

                                <td className="px-3 py-3">
                                  {item.status === "critical" ? (
                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                                      Critical
                                    </span>
                                  ) : item.status === "warning" ? (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-600">
                                      Warning
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                                      <CircleCheckBig size={12} />
                                      Stable
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <UserRound size={18} className="text-cyan-600" />
                    <h2 className="font-semibold text-slate-800">Detailed Patient Alerts</h2>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {summary.map((item) => {
                      const patient = item.patientInfo?.patient || {}
                      const name =
                        `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                        item.patientId

                      return (
                        <div
                          key={item.patientId}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between mb-3 gap-3">
                            <div>
                              <h3 className="font-semibold text-slate-800">{name}</h3>
                              <p className="text-xs text-slate-500">{item.patientId}</p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {item.alerts.map((alert) => (
                              <div
                                key={`${item.patientId}-${alert.id}`}
                                className={`rounded-lg border p-3 ${getAlertCardClass(alert.level)}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {alert.title}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                      {alert.message}
                                    </p>
                                  </div>
                                  {alert.level === "critical" ? (
                                    <TriangleAlert size={16} className="text-red-500 mt-0.5" />
                                  ) : alert.level === "warning" ? (
                                    <CircleAlert size={16} className="text-amber-500 mt-0.5" />
                                  ) : (
                                    <CircleCheckBig size={16} className="text-emerald-500 mt-0.5" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}