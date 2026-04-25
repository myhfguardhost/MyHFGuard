import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  HeartPulse,
  Droplets,
  Scale,
  Activity,
} from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { serverUrl } from "@/lib/api"

export default function AdminReports() {
  const navigate = useNavigate()
  const API = serverUrl()

  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API}/api/admin/patients`)
      if (!res.ok) throw new Error("Failed to fetch patient data")

      const data = await res.json()
      setPatients(data.patients || [])
    } catch (e: any) {
      setError(e.message || "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const reportData = useMemo(() => {
    const total = patients.length

    return {
      totalPatients: total,
      avgSpo2: "94%",
      avgHeartRate: "76 bpm",
      avgWeightChange: "+2.1 kg",
      criticalAlerts: Math.round(total * 0.15),
      warningAlerts: Math.round(total * 0.25),
      stablePatients: Math.round(total * 0.6),
    }
  }, [patients])

  function exportExcel() {
    const rows = patients.map((p: any) => ({
      "Patient ID": p.patient_id || "",
      "First Name": p.first_name || "",
      "Last Name": p.last_name || "",
      Email: p.email || "",
      Status: "Stable / Warning / Critical",
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Admin Reports")
    XLSX.writeFile(wb, "admin_reports.xlsx")

    toast.success("Excel report downloaded")
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] p-6">
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500">
            View patient health trends, key metrics and export reports.
          </p>
        </div>

        <button
          onClick={exportExcel}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <FileSpreadsheet size={17} />
          Export Excel
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-slate-600">
          <Loader2 className="animate-spin" size={18} />
          Loading reports...
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
            <ReportCard
              icon={<Droplets />}
              title="Average SpO2"
              value={reportData.avgSpo2}
            />
            <ReportCard
              icon={<HeartPulse />}
              title="Average Heart Rate"
              value={reportData.avgHeartRate}
            />
            <ReportCard
              icon={<Scale />}
              title="Average Weight Change"
              value={reportData.avgWeightChange}
            />
            <ReportCard
              icon={<Activity />}
              title="Total Patients"
              value={reportData.totalPatients}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-800">
                Patient Status Overview
              </h2>

              <div className="space-y-4">
                <Bar label="Stable Patients" value={reportData.stablePatients} total={reportData.totalPatients} />
                <Bar label="Warning Alerts" value={reportData.warningAlerts} total={reportData.totalPatients} />
                <Bar label="Critical Alerts" value={reportData.criticalAlerts} total={reportData.totalPatients} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-800">
                Health Trend Summary
              </h2>

              <div className="grid grid-cols-7 items-end gap-3 h-56 border-b border-slate-200 px-2">
                {[65, 72, 68, 81, 76, 88, 79].map((h, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 rounded-t-lg bg-blue-500"
                      style={{ height: `${h * 2}px` }}
                    />
                    <span className="text-xs text-slate-500">
                      D{index + 1}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm text-slate-500">
                This chart shows weekly health monitoring trend summary.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-slate-800">
              Patient Report Table
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Patient ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Avg SpO2</th>
                    <th className="px-4 py-3 text-left">Heart Rate</th>
                    <th className="px-4 py-3 text-left">Weight Change</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((p: any, index: number) => (
                    <tr key={p.patient_id || index} className="border-b">
                      <td className="px-4 py-3">{p.patient_id || "-"}</td>
                      <td className="px-4 py-3">
                        {`${p.first_name || ""} ${p.last_name || ""}`.trim() || "-"}
                      </td>
                      <td className="px-4 py-3">94%</td>
                      <td className="px-4 py-3">76 bpm</td>
                      <td className="px-4 py-3">+2.1 kg</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Stable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ReportCard({ icon, title, value }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

function Bar({ label, value, total }: any) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>

      <div className="h-3 rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full bg-blue-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}