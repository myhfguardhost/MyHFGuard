import { Bell, CircleAlert, Mail, TriangleAlert } from "lucide-react"

export default function AdminRecentAlerts({
  alertsToShow,
  acknowledgeAlert,
  goToPatient,
  sendAlertEmail,
}) {
  return (
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
  )
}