import { Activity } from "lucide-react"

export default function AdminActivityFeed({ summary }) {
  return (
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
  )
}