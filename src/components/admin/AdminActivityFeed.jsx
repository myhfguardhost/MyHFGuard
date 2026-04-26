import { Activity, AlertTriangle, HeartPulse, Scale, CheckCircle } from "lucide-react"

export default function AdminActivityFeed({ summary = [] }) {
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

          const activity = getActivity(item)

          return (
            <div
              key={item.patientId}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${activity.boxStyle}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-2 ${activity.iconStyle}`}>
                  {activity.icon}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {activity.message}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500">recently</span>
            </div>
          )
        })}

        {summary.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No activity available.
          </div>
        )}
      </div>
    </section>
  )
}

function getActivity(item) {
  const s = item.summaryData?.summary || {}
  const vitals = item.vitalsData?.vitals || {}

  const hr = s.heartRate
  const bpSys = s.bpSystolic
  const bpDia = s.bpDiastolic

  const latestWeight =
    vitals.weight?.length > 0
      ? vitals.weight[vitals.weight.length - 1]?.value
      : null

  if (item.status === "critical") {
    if (bpSys && bpDia) {
      return {
        message: `Critical blood pressure detected (${bpSys}/${bpDia} mmHg)`,
        icon: <AlertTriangle size={15} />,
        boxStyle: "bg-red-50 border-red-100",
        iconStyle: "bg-red-100 text-red-600",
      }
    }

    if (hr) {
      return {
        message: `Abnormal heart rate detected (${hr} bpm)`,
        icon: <HeartPulse size={15} />,
        boxStyle: "bg-red-50 border-red-100",
        iconStyle: "bg-red-100 text-red-600",
      }
    }

    return {
      message: "Critical alert detected",
      icon: <AlertTriangle size={15} />,
      boxStyle: "bg-red-50 border-red-100",
      iconStyle: "bg-red-100 text-red-600",
    }
  }

  if (item.status === "warning") {
    if (latestWeight) {
      return {
        message: `Weight change detected (${latestWeight} kg)`,
        icon: <Scale size={15} />,
        boxStyle: "bg-amber-50 border-amber-100",
        iconStyle: "bg-amber-100 text-amber-600",
      }
    }

    return {
      message: "Warning condition detected from latest readings",
      icon: <AlertTriangle size={15} />,
      boxStyle: "bg-amber-50 border-amber-100",
      iconStyle: "bg-amber-100 text-amber-600",
    }
  }

  return {
    message: "Vitals updated and patient condition stable",
    icon: <CheckCircle size={15} />,
    boxStyle: "bg-green-50 border-green-100",
    iconStyle: "bg-green-100 text-green-600",
  }
}