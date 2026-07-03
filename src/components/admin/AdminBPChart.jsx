import {
  CartesianGrid,
  Legend,
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


function getBpTime(row) {
  return String(
    row?.time ??
      row?.date ??
      row?.reading_date ??
      row?.created_at ??
      row?.time_ts ??
      ""
  );
}


function shortDate(value) {
  const text = String(value || "");


  if (text.length >= 16) {
    return text.slice(5, 16);
  }


  if (text.length >= 10) {
    return text.slice(5, 10);
  }


  return text;
}


export default function AdminBPChart({ summary = [], compact = false }) {
  const firstPatientWithBP = summary.find((item) => {
    const bpList = item?.vitalsData?.vitals?.bp || [];


    return bpList.some((row) => {
      const systolic = toNumber(row?.systolic ?? row?.sys ?? row?.bp_systolic);
      const diastolic = toNumber(
        row?.diastolic ?? row?.dia ?? row?.bp_diastolic
      );
      const pulse = toNumber(row?.pulse ?? row?.bp_pulse);


      return systolic !== null || diastolic !== null || pulse !== null;
    });
  });


  const patient = firstPatientWithBP?.patientInfo?.patient || {};


  const patientName =
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    firstPatientWithBP?.patientId ||
    "No patient";


  const data =
    firstPatientWithBP?.vitalsData?.vitals?.bp
      ?.map((row) => ({
        time: shortDate(getBpTime(row)),
        systolic: toNumber(row?.systolic ?? row?.sys ?? row?.bp_systolic),
        diastolic: toNumber(row?.diastolic ?? row?.dia ?? row?.bp_diastolic),
        pulse: toNumber(row?.pulse ?? row?.bp_pulse),
      }))
      ?.filter(
        (row) =>
          row.systolic !== null || row.diastolic !== null || row.pulse !== null
      ) || [];


  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-1 font-semibold text-slate-800">
        Blood Pressure Trend
      </h3>
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
            No blood pressure data available
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
                domain={["dataMin - 10", "dataMax + 10"]}
              />


              <Tooltip />


              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 8,
                }}
              />


              <Line
                type="monotone"
                dataKey="systolic"
                name="Systolic"
                unit=" mmHg"
                stroke="#dc2626"
                strokeWidth={4}
                dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={false}
              />


              <Line
                type="monotone"
                dataKey="diastolic"
                name="Diastolic"
                unit=" mmHg"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{ r: 6, strokeWidth: 2, fill: "#2563eb" }}
                activeDot={{ r: 8 }}
                connectNulls
                isAnimationActive={false}
              />


              <Line
                type="monotone"
                dataKey="pulse"
                name="Pulse"
                unit=" bpm"
                stroke="#16a34a"
                strokeWidth={4}
                dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }}
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

