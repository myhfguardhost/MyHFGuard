import { Footprints, HeartPulse, Waves } from "lucide-react"
import AdminWeightChart from "@/components/admin/AdminWeightChart"
import AdminBPChart from "@/components/admin/AdminBPChart"

export default function AdminKeyMetricsPanel({ dashboardData, summary }) {
  return (
    <section className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
      <h2 className="font-semibold text-slate-800 mb-3">Key Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <Waves className="text-cyan-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg SpO₂</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardData.avgSpo2}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <HeartPulse className="text-rose-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Heart Rate</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardData.avgHr} bpm</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <Footprints className="text-emerald-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Daily Steps</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardData.avgSteps}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AdminWeightChart summary={summary} compact />
        <AdminBPChart summary={summary} compact />
      </div>
    </section>
  )
}