import { useMemo, useState } from "react"
import {
  Bell,
  CircleAlert,
  Mail,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react"


export default function AdminRecentAlerts({
  alertsToShow = [],
  acknowledgeAlert,
  goToPatient,
  sendAlertEmail,
  summary = [],
}) {
  const [expanded, setExpanded] = useState(false)


  const getDateTime = (value) => {
    const time = new Date(value || 0).getTime()
    return Number.isNaN(time) ? 0 : time
  }


  const sortedAlerts = useMemo(() => {
    return [...alertsToShow].sort((a, b) => {
      return getDateTime(b.createdAt || b.created_at) - getDateTime(a.createdAt || a.created_at)
    })
  }, [alertsToShow])


  const visibleAlerts = useMemo(() => {
    return expanded ? sortedAlerts : sortedAlerts.slice(0, 4)
  }, [expanded, sortedAlerts])


  const getPatientName = (patientId) => {
    const row = summary.find((item) => item.patientId === patientId)
    const patient = row?.patientInfo?.patient || {}


    return (
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
      patient.full_name ||
      patient.name ||
      "Unknown Patient"
    )
  }


  const formatDateTime = (value) => {
    if (!value) return ""


    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""


    return date.toLocaleString()
  }


  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recent Alerts</h2>
          <p className="text-sm text-slate-500">
            Latest patient warning and critical alerts
          </p>
        </div>


        <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <Bell size={14} />
          {sortedAlerts.length} alerts
        </div>
      </div>


      <div className="space-y-3">
        {sortedAlerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No active alerts found.
          </div>
        ) : (
          <>
            {visibleAlerts.map((alert) => {
              const patientName = getPatientName(alert.patientId)
              const alertTime = formatDateTime(alert.createdAt || alert.created_at)


              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-3 shadow-sm ${
                    alert.level === "critical"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 pt-0.5">
                      {alert.level === "critical" ? (
                        <TriangleAlert className="text-red-500" size={18} />
                      ) : (
                        <CircleAlert className="text-amber-500" size={18} />
                      )}
                    </div>


                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <p className="break-words text-sm font-bold text-slate-900">
                          {alert.title}: {patientName}
                        </p>


                        {alertTime && (
                          <p className="shrink-0 text-xs text-slate-500">
                            {alertTime}
                          </p>
                        )}
                      </div>


                      <p className="mt-1 break-words text-xs leading-relaxed text-slate-700">
                        {alert.message}
                      </p>
                    </div>
                  </div>


                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Acknowledge
                    </button>


                    <button
                      type="button"
                      onClick={() => goToPatient(alert.patientId)}
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      View Profile
                    </button>


                    <button
                      type="button"
                      onClick={() => sendAlertEmail(alert)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <Mail size={12} />
                      Send Email
                    </button>
                  </div>
                </div>
              )
            })}


            {sortedAlerts.length > 4 && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={16} />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    View More Alerts
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

