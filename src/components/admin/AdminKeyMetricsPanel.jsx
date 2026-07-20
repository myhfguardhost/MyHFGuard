import { Footprints, Scale, Waves } from "lucide-react"
import AdminWeightChart from "@/components/admin/AdminWeightChart"
import AdminBPChart from "@/components/admin/AdminBPChart"

export default function AdminKeyMetricsPanel({ dashboardData, summary = [] }) {
  const realData = getRealMetrics(summary)

  const avgSpo2 =
    realData.avgSpo2 !== "-" ? realData.avgSpo2 : dashboardData.avgSpo2

  const avgSteps =
    realData.avgSteps !== "-" ? realData.avgSteps : dashboardData.avgSteps

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900 mb-1">Key Metrics</h2>
      <p className="mb-4 text-xs text-slate-500">Calculated from the latest 7 days of available patient data.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <MetricCard
          icon={<Waves className="text-cyan-600" size={18} />}
          label="Avg SpO₂"
          value={avgSpo2 === "-" ? "No data" : `${avgSpo2}%`}
        />

        <MetricCard
          icon={<Footprints className="text-emerald-600" size={18} />}
          label="Avg Daily Steps"
          value={avgSteps === "-" ? "No data" : avgSteps}
        />

        <MetricCard
          icon={<Scale className="text-blue-600" size={18} />}
          label="Avg Weight"
          value={realData.avgWeight === "-" ? "No data" : `${realData.avgWeight} kg`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AdminWeightChart summary={summary} compact />
        <AdminBPChart summary={summary} compact />
      </div>
    </section>
  )
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white p-2">{icon}</div>
        <div>
          <p className="text-xs text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function getRealMetrics(summary) {
  let spo2Total = 0
  let spo2Count = 0

  let stepsTotal = 0
  let stepsCount = 0

  let weightTotal = 0
  let weightCount = 0

  summary.forEach((item) => {
    const vitals = item.vitalsData?.vitals || {}

    const spo2Values = (vitals.spo2 || [])
      .map((row) => Number(row?.avg))
      .filter((value) => Number.isFinite(value) && value > 0)

    const stepValues = (vitals.steps || [])
      .map((row) => Number(row?.count))
      .filter((value) => Number.isFinite(value) && value >= 0)

    const weightValues = (vitals.weight || [])
      .map((row) => Number(row?.value))
      .filter((value) => Number.isFinite(value) && value > 0)

    spo2Values.forEach((value) => {
      spo2Total += value
      spo2Count++
    })

    stepValues.forEach((value) => {
      stepsTotal += value
      stepsCount++
    })

    weightValues.forEach((value) => {
      weightTotal += value
      weightCount++
    })
  })

  return {
    avgSpo2: spo2Count ? Math.round(spo2Total / spo2Count) : "-",
    avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : "-",
    avgWeight: weightCount ? (weightTotal / weightCount).toFixed(1) : "-",
  }
}