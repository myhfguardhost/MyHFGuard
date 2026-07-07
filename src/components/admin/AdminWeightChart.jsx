import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
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

function getWeightValue(row) {
  return toNumber(
    row?.value ?? row?.kg_avg ?? row?.kg ?? row?.weight ?? row?.weightKg
  );
}

function getWeightTime(row) {
  return String(row?.time ?? row?.date ?? row?.time_ts ?? row?.created_at ?? "");
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

export default function AdminWeightChart({ summary = [], compact = false }) {
  const chartHeight = compact ? 240 : 280;
  const { ref, width } = useChartSize(compact ? 320 : 520);

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
            No weight data available
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
              domain={["dataMin - 1", "dataMax + 1"]}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              name="Weight"
              unit=" kg"
              stroke="#9333ea"
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