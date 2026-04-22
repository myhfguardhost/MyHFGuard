import { Activity } from "lucide-react"

export default function AdminActivityFeed({ summary }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-cyan-600" />
        <h2 className="font-semibold text-slate-900">Activity Feed</h2>
      </div>

      <div className="space-y-3">
        {summary.slice(0, 5).map((item) => {
          const patient = item.patientInfo?.patient || {}
          const name =
            `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
            item.patientId

          return (
            <div
              key={item.patientId}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Latest status: {item.status}
                </p>
              </div>
              <span className="text-xs text-slate-500">recently</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}