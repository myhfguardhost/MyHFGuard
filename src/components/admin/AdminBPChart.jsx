import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function useChartSize(defaultWidth = 520) {
  const ref = useRef(null);
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);

      if (nextWidth > 20) {
        setWidth(nextWidth);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return { ref, width };
}

export default function AdminBPChart({ summary = [], compact = false }) {
  const chartHeight = compact ? 240 : 280;
  const { ref, width } = useChartSize(compact ? 320 : 520);

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
        ref={ref}
        style={{
          height: chartHeight,
          minHeight: chartHeight,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-white text-sm text-slate-500">
            No blood pressure data available
          </div>
        ) : (
          <LineChart
            width={Math.max(width, 260)}
            height={chartHeight}
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
              dataKey="diastolic"
              name="Diastolic"
              unit=" mmHg"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 7 }}
              connectNulls
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="pulse"
              name="Pulse"
              unit=" bpm"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 7 }}
              connectNulls
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="systolic"
              name="Systolic"
              unit=" mmHg"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 7 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </div>
    </div>
  );
}