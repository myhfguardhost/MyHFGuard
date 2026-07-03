import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}


function getWeightValue(row) {
  return toNumber(
    row?.value ??
      row?.kg_avg ??
      row?.kg ??
      row?.weight ??
      row?.weightKg
  );
}


function getWeightTime(row) {
  return String(
    row?.time ??
      row?.date ??
      row?.time_ts ??
      row?.created_at ??
      ""
  );
}


function shortDate(value) {
  const text = String(value || "");


  if (text.length >= 10) {
    return text.slice(5, 10);
  }


  return text;
}


export default function AdminWeightChart({ summary = [], compact = false }) {
  const firstPatientWithWeight = summary.find((item) => {
    const weightList = item?.vitalsData?.vitals?.weight || [];


    return weightList.some((row) => getWeightValue(row) !== null);
  });


  const patient = firstPatientWithWeight?.patientInfo?.patient || {};


  const patientName =
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    firstPatientWithWeight?.patientId ||
    "No patient";


  const data =
    firstPatientWithWeight?.vitalsData?.vitals?.weight
      ?.map((row) => ({
        time: shortDate(getWeightTime(row)),
        value: getWeightValue(row),
      }))
      ?.filter((row) => row.value !== null) || [];


  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-1 font-semibold text-slate-800">Weight Trend</h3>
      <p className="mb-3 text-xs text-slate-500">{patientName}</p>


      <div
        style={{
          height: compact ? 240 : 280,
          minHeight: compact ? 240 : 280,
          width: "100%",
        }}
      >
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-white text-sm text-slate-500">
            No weight data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 5, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />


              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: "#334155" }}
                stroke="#64748b"
              />


              <YAxis
                tick={{ fontSize: 12, fill: "#334155" }}
                stroke="#64748b"
                domain={["dataMin - 1", "dataMax + 1"]}
              />


              <Tooltip />


              <Line
                type="monotone"
                dataKey="value"
                name="Weight"
                unit=" kg"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{ r: 6, strokeWidth: 2, fill: "#2563eb" }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

