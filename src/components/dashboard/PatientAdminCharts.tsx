import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { format } from "date-fns";

interface Props {
  vitals: {
    hr?: Array<{ time: string; min: number; avg: number; max: number }>;
    spo2?: Array<{ time: string; min: number; avg: number; max: number }>;
    steps?: Array<{ time: string; count: number }>;
    bp?: Array<{ time: string; systolic: number; diastolic: number; pulse: number }>;
  };
  period?: string;
}

export default function PatientAdminCharts({ vitals }: Props) {
  const formatDateLabel = (t: string) => {
    const d = new Date(t);
    return isNaN(d.getTime()) ? t : format(d, "MMM d");
  };

  const formatTimeLabel = (t: string) => {
    const d = new Date(t);
    return isNaN(d.getTime()) ? t : format(d, "MMM d h:mm a");
  };

  const hrData = (vitals.hr || [])
    .filter(r => Number(r.avg) > 0)
    .map(r => ({
      ...r,
      min: Number(r.min),
      avg: Number(r.avg),
      max: Number(r.max),
      date: formatDateLabel(r.time),
    }));

  const spo2Data = (vitals.spo2 || [])
    .filter(r => Number(r.avg) > 0)
    .map(r => ({
      ...r,
      min: Number(r.min),
      avg: Number(r.avg),
      max: Number(r.max),
      date: formatDateLabel(r.time),
    }));

  const stepsData = (vitals.steps || [])
    .filter(r => Number(r.count) >= 0)
    .map(r => ({
      ...r,
      count: Number(r.count),
      date: formatDateLabel(r.time),
    }));

  const bpData = (vitals.bp || [])
    .filter(r =>
      Number(r.systolic) > 0 &&
      Number(r.diastolic) > 0 &&
      Number(r.pulse) > 0
    )
    .map(r => ({
      ...r,
      systolic: Number(r.systolic),
      diastolic: Number(r.diastolic),
      pulse: Number(r.pulse),
      timeLabel: formatTimeLabel(r.time),
    }));

  const EmptyState = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
      {text}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="h-[380px] overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Daily Steps</CardTitle>
        </CardHeader>
        <CardContent className="h-[310px] overflow-visible">
          {stepsData.length === 0 ? (
            <EmptyState text="No steps data available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepsData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <YAxis stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Steps" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="h-[380px] overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Heart Rate (BPM)</CardTitle>
        </CardHeader>
        <CardContent className="h-[310px] overflow-visible">
          {hrData.length === 0 ? (
            <EmptyState text="No heart rate data available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <YAxis domain={["dataMin - 10", "dataMax + 10"]} stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <Tooltip />
                <Legend />
                <Line type="linear" dataKey="max" stroke="#dc2626" strokeWidth={5} dot={{ r: 7, fill: "#dc2626" }} name="Max" connectNulls />
                <Line type="linear" dataKey="avg" stroke="#f97316" strokeWidth={5} dot={{ r: 7, fill: "#f97316" }} name="Avg" connectNulls />
                <Line type="linear" dataKey="min" stroke="#16a34a" strokeWidth={5} dot={{ r: 7, fill: "#16a34a" }} name="Min" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="h-[380px] overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Blood Pressure</CardTitle>
        </CardHeader>
        <CardContent className="h-[310px] overflow-visible">
          {bpData.length === 0 ? (
            <EmptyState text="No blood pressure data available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpData} margin={{ top: 10, right: 35, left: 10, bottom: 25 }}>
                <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" fontSize={11} stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} angle={-15} textAnchor="end" height={55} />
                <YAxis domain={["dataMin - 10", "dataMax + 10"]} stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} allowDecimals={false} />
                <Tooltip />
                <Legend verticalAlign="bottom" height={20} />
                <ReferenceLine y={120} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" />
                <ReferenceLine y={80} stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="linear" dataKey="systolic" stroke="#dc2626" strokeWidth={5} dot={{ r: 8, fill: "#dc2626" }} name="Systolic" connectNulls />
                <Line type="linear" dataKey="diastolic" stroke="#2563eb" strokeWidth={5} dot={{ r: 8, fill: "#2563eb" }} name="Diastolic" connectNulls />
                <Line type="linear" dataKey="pulse" stroke="#f97316" strokeWidth={5} dot={{ r: 8, fill: "#f97316" }} name="Pulse" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="h-[380px] overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>SpO2 (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-[310px] overflow-visible">
          {spo2Data.length === 0 ? (
            <EmptyState text="No SpO2 data available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spo2Data} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <YAxis domain={[80, 100]} stroke="#0f172a" tick={{ fill: "#0f172a", fontWeight: 600 }} />
                <Tooltip />
                <Line type="linear" dataKey="avg" stroke="#0891b2" strokeWidth={5} dot={{ r: 8, fill: "#0891b2" }} activeDot={{ r: 10 }} name="Avg %" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}