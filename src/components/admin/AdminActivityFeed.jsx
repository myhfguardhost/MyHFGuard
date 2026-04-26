import { Activity, UserCircle } from "lucide-react"

export default function AdminActivityFeed({ summary = [] }) {
  const feedItems = buildFeedItems(summary)

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-cyan-600" />
        <h2 className="font-semibold text-slate-900">Activity Feed</h2>
      </div>

      <div className="space-y-3">
        {feedItems.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No recent user activity.
          </div>
        ) : (
          feedItems.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserCircle size={22} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500 whitespace-nowrap">
                {item.time}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function buildFeedItems(summary) {
  const items = []

  summary.forEach((item) => {
    const patient = item.patientInfo?.patient || {}
    const name =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
      item.patientId

    const s = item.summaryData?.summary || {}
    const vitals = item.vitalsData?.vitals || {}

    const latestWeight =
      vitals.weight?.length > 0
        ? vitals.weight[vitals.weight.length - 1]
        : null

    const latestSpo2 =
      vitals.spo2?.length > 0
        ? vitals.spo2[vitals.spo2.length - 1]
        : null

    const bpSys = s.bpSystolic
    const bpDia = s.bpDiastolic
    const hr = s.heartRate
    const steps = s.stepsToday

    if (latestWeight?.value) {
      items.push({
        message: `${name} submitted weight log`,
        detail: `Latest weight: ${latestWeight.value} kg`,
        time: getActivityTime(latestWeight),
      })
    }

    if (bpSys && bpDia) {
      items.push({
        message: `${name} updated blood pressure reading`,
        detail: `BP ${bpSys}/${bpDia} mmHg${hr ? `, Heart Rate ${hr} bpm` : ""}`,
        time: getActivityTime(s),
      })
    }

    if (latestSpo2?.avg) {
      items.push({
        message: `${name} synced SpO₂ data`,
        detail: `Latest SpO₂: ${latestSpo2.avg}%`,
        time: getActivityTime(latestSpo2),
      })
    }

    if (steps !== undefined && steps !== null) {
      items.push({
        message: `${name} synced smartband step count`,
        detail: `Today steps: ${steps}`,
        time: getActivityTime(s),
      })
    }

    if (item.status === "critical") {
      items.push({
        message: `${name} triggered a critical alert`,
        detail: item.alerts?.[0]?.message || "Critical condition detected",
        time: getActivityTime(s),
      })
    }
  })

  return items
}

function getActivityTime(data) {
  const time =
    data?.updated_at ||
    data?.created_at ||
    data?.timestamp ||
    data?.recorded_at ||
    data?.date ||
    null

  if (!time) return "recently"

  const diffMs = Date.now() - new Date(time).getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} mins ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hours ago`

  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} days ago`
}