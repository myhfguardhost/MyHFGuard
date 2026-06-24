import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

export default function AdminBPChart({ summary, compact = false }) {
  const firstPatientWithBP = summary.find(
    (item) => item?.vitalsData?.vitals?.bp && item.vitalsData.vitals.bp.length > 0
  )

  const patient = firstPatientWithBP?.patientInfo?.patient || {}
  const patientName =
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    firstPatientWithBP?.patientId ||
    "No patient"

  const data =
    firstPatientWithBP?.vitalsData?.vitals?.bp
      ?.filter((item) => Number(item.systolic) > 0 && Number(item.diastolic) > 0)
      ?.map((item) => ({
        time: item.time,
        systolic: Number(item.systolic),
        diastolic: Number(item.diastolic),
        pulse: Number(item.pulse),
      })) || []

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm text-slate-900">
      <h3 className="font-semibold text-slate-900 mb-1">Blood Pressure Trend</h3>
      <p className="text-xs text-slate-600 mb-3">{patientName}</p>

      <div className={compact ? "h-56" : "h-72"}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-600">
            No blood pressure data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 25, left: 5, bottom: 10 }}>
              <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "#0f172a", fontWeight: 600 }}
                stroke="#0f172a"
              />
              <YAxis
                domain={["dataMin - 10", "dataMax + 10"]}
                tick={{ fontSize: 11, fill: "#0f172a", fontWeight: 600 }}
                stroke="#0f172a"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #0f172a",
                  borderRadius: "8px",
                  color: "#0f172a",
                }}
              />
              <Legend />

              <Line
                type="linear"
                dataKey="systolic"
                stroke="#dc2626"
                strokeWidth={4}
                dot={{ r: 6, fill: "#dc2626" }}
                name="Systolic"
                connectNulls
              />
              <Line
                type="linear"
                dataKey="diastolic"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{ r: 6, fill: "#2563eb" }}
                name="Diastolic"
                connectNulls
              />
              <Line
                type="linear"
                dataKey="pulse"
                stroke="#f97316"
                strokeWidth={4}
                dot={{ r: 6, fill: "#f97316" }}
                name="Pulse"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}