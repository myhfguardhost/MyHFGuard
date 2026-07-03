import { useEffect, useRef, useState } from "react";
import { generatePatientPdf } from "@/lib/pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AdminPatientFullData, getAdminPatientFullData, PatientProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  endOfDay,
  format,
  startOfDay,
  subMonths,
  subYears,
} from "date-fns";
import { DateScrollPicker } from "@/components/ui/date-scroll-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function toPositiveNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toZeroOrPositiveNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatChartDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString).slice(0, 10);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDateTime(value: any) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 19);
  return date.toLocaleString();
}

function formatDateOnly(value: any) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString();
}

function formatBpTime(dateString: string, timeString: string) {
  const dateLabel = formatChartDate(dateString);
  const timeLabel = String(timeString || "").substring(0, 5);
  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
}

function getRecordValue(record: any, keys: string[]) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  }
  return null;
}

function hasRows(data: any[]) {
  return Array.isArray(data) && data.length > 0;
}

function hasStepsData(data: any[]) {
  return data.some((record) => record.count !== null);
}

function hasHrData(data: any[]) {
  return data.some(
    (record) => record.min !== null || record.avg !== null || record.max !== null
  );
}

function hasSpo2Data(data: any[]) {
  return data.some(
    (record) => record.min !== null || record.avg !== null || record.max !== null
  );
}

function hasBpData(data: any[]) {
  return data.some(
    (record) =>
      record.systolic !== null || record.diastolic !== null || record.pulse !== null
  );
}

function hasWeightData(data: any[]) {
  return data.some((record) => record.kg !== null);
}

function cleanNotes(value: any) {
  if (!value) return "-";
  const text = String(value);
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");
    }
  } catch (_) {}
  return text;
}

function symptomTotal(row: any) {
  return (
    Number(row?.sob_activity || row?.breathlessness || 0) +
    Number(row?.leg_swelling || row?.swelling || 0) +
    Number(row?.orthopnea || row?.sleeping || 0) +
    Number(row?.cough || 0) +
    Number(row?.abd_discomfort || row?.abdomen || 0)
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div
      style={{ height: 300, minHeight: 300, width: "100%" }}
      className="flex items-center justify-center rounded-lg bg-white text-sm text-slate-500"
    >
      {message}
    </div>
  );
}

function MiniEmpty({ message = "No data" }: { message?: string }) {
  return <p className="py-4 text-center text-slate-500">{message}</p>;
}

function StatCard({ title, value, detail }: { title: string; value: any; detail?: string }) {
  return (
    <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? "-"}</p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </CardContent>
    </Card>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const backPath = location.state?.from || "/admin/patients";

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [fullData, setFullData] = useState<AdminPatientFullData | null>(null);
  const [vitals, setVitals] = useState<any>({
    hr: [],
    spo2: [],
    steps: [],
    bp: [],
    weight: [],
  });

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  useEffect(() => {
    if (id && dateRange?.from && dateRange?.to) {
      fetchData(id, dateRange.from, dateRange.to);
    }
  }, [id, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  const fetchData = async (patientId: string, startDate: Date, endDate: Date) => {
    setLoading(true);

    try {
      const startStr = format(startOfDay(startDate), "yyyy-MM-dd");
      const endStr = format(endOfDay(endDate), "yyyy-MM-dd");
      const data = await getAdminPatientFullData(patientId, startStr, endStr);

      if (!data?.patient && !data?.profile) {
        toast.error("Patient not found or no profile data returned");
      }

      const patient = data.patient || {};
      const profileRow = data.profile || {};
      const profileData: PatientProfile = {
        patient_id: patient.patient_id || patientId,
        first_name: patient.first_name || profileRow.first_name || profileRow.full_name || "",
        last_name: patient.last_name || profileRow.last_name || "",
        email: patient.email || profileRow.email || null,
        created_at: patient.created_at || profileRow.created_at || null,
        last_sign_in_at: patient.last_sign_in_at || null,
        date_of_birth: patient.date_of_birth || patient.dob || profileRow.date_of_birth || profileRow.dob,
      };

      setProfile(profileData);
      setFullData(data);

      const hrData = data.vitals?.hr || [];
      const spo2Data = data.vitals?.spo2 || [];
      const stepsData = data.vitals?.steps || [];
      const bpData = data.vitals?.bp || [];
      const weightDayData = data.vitals?.weight || [];
      const weightSamples = data.vitals?.weightSamples || [];

      const formattedHr = hrData
        .map((record: any) => ({
          fullDate: record.date,
          date: formatChartDate(record.date),
          min: toPositiveNumber(record.hr_min),
          avg: toPositiveNumber(record.hr_avg),
          max: toPositiveNumber(record.hr_max),
          count: toZeroOrPositiveNumber(record.hr_count),
        }))
        .filter(
          (record: any) =>
            record.min !== null || record.avg !== null || record.max !== null
        );

      const formattedSpo2 = spo2Data
        .map((record: any) => ({
          fullDate: record.date,
          date: formatChartDate(record.date),
          min: toPositiveNumber(record.spo2_min),
          avg: toPositiveNumber(record.spo2_avg),
          max: toPositiveNumber(record.spo2_max),
          count: toZeroOrPositiveNumber(record.spo2_count),
        }))
        .filter(
          (record: any) =>
            record.min !== null || record.avg !== null || record.max !== null
        );

      const formattedSteps = stepsData
        .map((record: any) => ({
          fullDate: record.date,
          date: formatChartDate(record.date),
          count: toZeroOrPositiveNumber(
            record.steps_total ?? record.total_steps ?? record.steps
          ),
        }))
        .filter((record: any) => record.count !== null);

      const formattedBp = bpData
        .map((reading: any) => ({
          fullDate: reading.reading_date,
          time: formatBpTime(reading.reading_date, reading.reading_time),
          systolic: toPositiveNumber(
            reading.systolic ?? reading.bp_systolic ?? reading.sys
          ),
          diastolic: toPositiveNumber(
            reading.diastolic ?? reading.bp_diastolic ?? reading.dia
          ),
          pulse: toPositiveNumber(reading.pulse ?? reading.bp_pulse),
        }))
        .filter(
          (record: any) =>
            record.systolic !== null || record.diastolic !== null || record.pulse !== null
        );

      const formattedWeight = (weightDayData.length > 0 ? weightDayData : [...weightSamples].reverse())
        .map((record: any) => {
          const dateValue = record.date || record.time_ts;
          return {
            fullDate: dateValue,
            date: formatChartDate(dateValue),
            kg: toPositiveNumber(
              record.kg_avg ?? record.kg ?? record.value ?? record.weight_kg
            ),
          };
        })
        .filter((record: any) => record.kg !== null);

      setVitals({
        hr: formattedHr,
        spo2: formattedSpo2,
        steps: formattedSteps,
        bp: formattedBp,
        weight: formattedWeight,
      });
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error?.message || "Failed to fetch patient data");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (months: number) => {
    const to = new Date();
    const from = subMonths(to, months);
    setDateRange({ from, to });
  };

  const setYearPreset = (years: number) => {
    const to = new Date();
    const from = subYears(to, years);
    setDateRange({ from, to });
  };

  const refreshPatient = () => {
    if (id && dateRange?.from && dateRange?.to) {
      fetchData(id, dateRange.from, dateRange.to);
    }
  };

  const downloadPdf = () => {
    if (profile && pdfRef.current) {
      generatePatientPdf(profile, pdfRef.current);
    }
  };

  const patientName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      fullData?.profile?.full_name ||
      "Patient Details"
    : "Patient Details";

  const summary = fullData?.summary || {};
  const symptoms = fullData?.logs?.symptoms || [];
  const waterSalt = fullData?.logs?.waterSalt || [];
  const medications = fullData?.logs?.medications || [];
  const profileMedicationText = fullData?.profile?.current_medication || fullData?.patient?.current_medication || "";
  const fallbackMedicationRows = profileMedicationText
    ? String(profileMedicationText)
        .split(/\n|,/)
        .map((item: string) => item.trim())
        .filter(Boolean)
        .map((name: string, index: number) => ({ id: `profile-med-${index}`, name, schedule: "Saved in patient profile", active: true }))
    : [];
  const medicationRows = hasRows(medications) ? medications : fallbackMedicationRows;
  const reminders = fullData?.logs?.reminders || [];
  const devices = fullData?.devices || [];
  const deviceSync = fullData?.deviceSync || [];
  const errors = fullData?.errors || {};
  const latestSync = summary.lastSyncTs || deviceSync[0]?.last_sync_ts || deviceSync[0]?.updated_at;

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Patient Details"
              subtitle="View complete patient health records from app, website and smart band sync."
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              onRefresh={refreshPatient}
              showExport={false}
            />

            {loading && !profile ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-medium">Loading complete patient details...</span>
                </div>
              </div>
            ) : !profile ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Patient not found.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(backPath)}
                      className="shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-bold text-slate-900 sm:text-3xl">
                        {patientName}
                      </h1>
                      <p className="mt-1 break-all text-sm text-slate-500">
                        ID: {profile.patient_id}
                      </p>
                      {latestSync && (
                        <p className="mt-1 text-sm text-slate-500">
                          Last sync: {formatFullDateTime(latestSync)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={refreshPatient}
                      className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>

                    <Button
                      onClick={downloadPdf}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">Quick Range:</span>
                    <Button variant="outline" size="sm" onClick={() => setPreset(1)}>1M</Button>
                    <Button variant="outline" size="sm" onClick={() => setPreset(3)}>3M</Button>
                    <Button variant="outline" size="sm" onClick={() => setPreset(6)}>6M</Button>
                    <Button variant="outline" size="sm" onClick={() => setYearPreset(1)}>1Y</Button>
                    <Button variant="outline" size="sm" onClick={() => setYearPreset(3)}>3Y</Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">Custom Range:</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[150px] justify-start bg-white text-left font-normal text-slate-700",
                            !dateRange?.from && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : <span>Start Date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateScrollPicker
                          date={dateRange?.from}
                          setDate={(date) =>
                            setDateRange((prev) => ({ ...prev, from: date, to: prev?.to }))
                          }
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-slate-400">-</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[150px] justify-start bg-white text-left font-normal text-slate-700",
                            !dateRange?.to && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : <span>End Date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateScrollPicker
                          date={dateRange?.to}
                          setDate={(date) =>
                            setDateRange((prev) => ({ ...prev, from: prev?.from, to: date }))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Some optional admin tables could not be loaded: {Object.keys(errors).join(", ")}. Other available patient data is still shown below.
                  </div>
                )}

                <div ref={pdfRef} className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">Complete Overview</h2>
                    {dateRange?.from && dateRange?.to && (
                      <p className="text-sm text-slate-500">
                        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard title="Heart Rate" value={summary.heartRate ? `${summary.heartRate} bpm` : "-"} detail="Latest band/app data" />
                    <StatCard title="SpO₂" value={summary.spo2 ? `${summary.spo2}%` : "-"} detail="Latest band/app data" />
                    <StatCard title="Steps Today" value={summary.stepsToday ?? "-"} detail={summary.latestSteps ? `Latest day: ${summary.latestSteps}` : "From Health Connect"} />
                    <StatCard title="Blood Pressure" value={summary.bpSystolic && summary.bpDiastolic ? `${summary.bpSystolic}/${summary.bpDiastolic}` : "-"} detail={summary.bpPulse ? `Pulse ${summary.bpPulse}` : "Self-check data"} />
                    <StatCard title="Weight" value={summary.weightKg ? `${summary.weightKg} kg` : "-"} detail="Manual/OCR self-check" />
                    <StatCard title="Water / Salt" value={summary.waterIntakeMl ? `${summary.waterIntakeMl} ml` : "-"} detail={summary.saltStatus ? `Salt: ${summary.saltStatus}` : "Water & diet log"} />
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Daily Steps</CardTitle></CardHeader>
                      <CardContent>
                        {!hasStepsData(vitals.steps) ? (
                          <NoData message="No steps data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={vitals.steps} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <Tooltip />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Steps" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Heart Rate (BPM)</CardTitle></CardHeader>
                      <CardContent>
                        {!hasHrData(vitals.hr) ? (
                          <NoData message="No heart rate data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={vitals.hr} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="max" stroke="#dc2626" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }} activeDot={{ r: 8 }} name="Max" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#f97316" }} activeDot={{ r: 8 }} name="Avg" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="min" stroke="#16a34a" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }} activeDot={{ r: 8 }} name="Min" connectNulls isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Blood Pressure</CardTitle></CardHeader>
                      <CardContent>
                        {!hasBpData(vitals.bp) ? (
                          <NoData message="No blood pressure data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={vitals.bp} margin={{ top: 20, right: 30, left: 5, bottom: 35 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#334155" }} stroke="#64748b" />
                                <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }} activeDot={{ r: 8 }} name="Systolic" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="diastolic" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#2563eb" }} activeDot={{ r: 8 }} name="Diastolic" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="pulse" stroke="#16a34a" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }} activeDot={{ r: 8 }} name="Pulse" connectNulls isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">SpO₂ (%)</CardTitle></CardHeader>
                      <CardContent>
                        {!hasSpo2Data(vitals.spo2) ? (
                          <NoData message="No SpO₂ data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={vitals.spo2} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="max" stroke="#dc2626" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }} activeDot={{ r: 8 }} name="Max %" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="avg" stroke="#06b6d4" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#06b6d4" }} activeDot={{ r: 8 }} name="Avg %" connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="min" stroke="#16a34a" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }} activeDot={{ r: 8 }} name="Min %" connectNulls isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm xl:col-span-2">
                      <CardHeader><CardTitle className="text-slate-900">Weight Trend</CardTitle></CardHeader>
                      <CardContent>
                        {!hasWeightData(vitals.weight) ? (
                          <NoData message="No weight data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={vitals.weight} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12, fill: "#334155" }} stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="kg" stroke="#9333ea" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#9333ea" }} activeDot={{ r: 8 }} name="Weight kg" connectNulls isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">Raw Band and Self-care Data Logs</h3>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Steps Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasStepsData(vitals.steps) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                            <TableBody>{[...vitals.steps].reverse().map((record: any, index: number) => (
                              <TableRow key={index}><TableCell>{record.fullDate}</TableCell><TableCell>{record.count}</TableCell></TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Heart Rate Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasHrData(vitals.hr) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Min</TableHead><TableHead>Avg</TableHead><TableHead>Max</TableHead></TableRow></TableHeader>
                            <TableBody>{[...vitals.hr].reverse().map((record: any, index: number) => (
                              <TableRow key={index}><TableCell>{record.fullDate}</TableCell><TableCell>{record.min ?? "-"}</TableCell><TableCell>{record.avg ?? "-"}</TableCell><TableCell>{record.max ?? "-"}</TableCell></TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">SpO₂ Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasSpo2Data(vitals.spo2) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Min</TableHead><TableHead>Avg</TableHead><TableHead>Max</TableHead></TableRow></TableHeader>
                            <TableBody>{[...vitals.spo2].reverse().map((record: any, index: number) => (
                              <TableRow key={index}><TableCell>{record.fullDate}</TableCell><TableCell>{record.min ?? "-"}</TableCell><TableCell>{record.avg ?? "-"}</TableCell><TableCell>{record.max ?? "-"}</TableCell></TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">BP Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasBpData(vitals.bp) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Sys/Dia</TableHead><TableHead>Pulse</TableHead></TableRow></TableHeader>
                            <TableBody>{[...vitals.bp].reverse().map((record: any, index: number) => (
                              <TableRow key={index}><TableCell>{record.time}</TableCell><TableCell>{record.systolic}/{record.diastolic}</TableCell><TableCell>{record.pulse}</TableCell></TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Weight Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasWeightData(vitals.weight) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Weight</TableHead></TableRow></TableHeader>
                            <TableBody>{[...vitals.weight].reverse().map((record: any, index: number) => (
                              <TableRow key={index}><TableCell>{formatDateOnly(record.fullDate)}</TableCell><TableCell>{record.kg} kg</TableCell></TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Symptom Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasRows(symptoms) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                            <TableBody>{symptoms.map((row: any, index: number) => (
                              <TableRow key={row.id || index}>
                                <TableCell>{row.date || formatDateOnly(row.time_ts || row.created_at)}</TableCell>
                                <TableCell>{symptomTotal(row)}</TableCell>
                                <TableCell className="max-w-[320px] text-xs text-slate-600">Breathless {row.sob_activity ?? row.breathlessness ?? 0}, Swelling {row.leg_swelling ?? row.swelling ?? 0}, Cough {row.cough ?? 0}, Sleep {row.orthopnea ?? row.sleeping ?? 0}, Abdomen {row.abd_discomfort ?? row.abdomen ?? 0}{row.notes ? ` | ${cleanNotes(row.notes)}` : ""}</TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Water and Salt Diet Log</CardTitle></CardHeader>
                      <CardContent>
                        {!hasRows(waterSalt) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Water</TableHead><TableHead>Salt</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{waterSalt.map((row: any, index: number) => (
                              <TableRow key={row.id || index}>
                                <TableCell>{row.entry_date || row.date || formatDateOnly(row.created_at)}</TableCell>
                                <TableCell>{getRecordValue(row, ["water_intake_ml", "water_intake"] ) ?? "-"} ml</TableCell>
                                <TableCell>{getRecordValue(row, ["salt_score", "salt_intake"] ) ?? "-"}</TableCell>
                                <TableCell>{row.water_status || row.salt_status || "-"}</TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Medication Records</CardTitle></CardHeader>
                      <CardContent>
                        {!hasRows(medicationRows) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Medication/Class</TableHead><TableHead>Schedule</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{medicationRows.map((row: any, index: number) => (
                              <TableRow key={row.id || index}>
                                <TableCell>{row.name || row.medication_name || row.class || "-"}</TableCell>
                                <TableCell>{row.schedule || row.frequency || row.notify_hour || "-"}</TableCell>
                                <TableCell>{row.active === false ? "Inactive" : "Active"}</TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader><CardTitle className="text-slate-900">Reminders / Appointments</CardTitle></CardHeader>
                      <CardContent>
                        {!hasRows(reminders) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{reminders.map((row: any, index: number) => (
                              <TableRow key={row.id || index}>
                                <TableCell>{formatFullDateTime(row.due_ts || row.date || row.reminder_date)}</TableCell>
                                <TableCell>{row.title || row.type || "-"}</TableCell>
                                <TableCell>{row.status || row.notes || "-"}</TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="max-h-[380px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm xl:col-span-2">
                      <CardHeader><CardTitle className="text-slate-900">Connected Devices and Sync Status</CardTitle></CardHeader>
                      <CardContent>
                        {!hasRows(devices) && !hasRows(deviceSync) ? <MiniEmpty /> : (
                          <Table>
                            <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>Model / Platform</TableHead><TableHead>Last Sync</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {devices.map((row: any, index: number) => (
                                <TableRow key={`device-${row.device_id || index}`}>
                                  <TableCell className="break-all">{row.device_id || row.id || "-"}</TableCell>
                                  <TableCell>{row.model || row.platform || row.device_type || "-"}</TableCell>
                                  <TableCell>{formatFullDateTime(row.last_sync_ts || row.updated_at || row.created_at)}</TableCell>
                                </TableRow>
                              ))}
                              {deviceSync.map((row: any, index: number) => (
                                <TableRow key={`sync-${row.device_id || index}`}>
                                  <TableCell className="break-all">{row.device_id || "device_sync_status"}</TableCell>
                                  <TableCell>Sync status</TableCell>
                                  <TableCell>{formatFullDateTime(row.last_sync_ts || row.updated_at)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {loading && (
                  <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing...
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
