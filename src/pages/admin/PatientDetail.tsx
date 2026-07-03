import { useEffect, useRef, useState } from "react";
import { generatePatientPdf } from "@/lib/pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getPatientProfile, PatientProfile } from "@/lib/api";
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
import { supabase } from "@/lib/supabase";
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
  ReferenceLine,
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


  if (Number.isNaN(date.getTime())) {
    return String(dateString).slice(0, 10);
  }


  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}


function formatBpTime(dateString: string, timeString: string) {
  const dateLabel = formatChartDate(dateString);
  const timeLabel = String(timeString || "").substring(0, 5);


  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
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
      record.systolic !== null ||
      record.diastolic !== null ||
      record.pulse !== null
  );
}


function NoData({ message }: { message: string }) {
  return (
    <div
      style={{
        height: 300,
        minHeight: 300,
        width: "100%",
      }}
      className="flex items-center justify-center rounded-lg bg-white text-sm text-slate-500"
    >
      {message}
    </div>
  );
}


export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();


  const backPath = location.state?.from || "/admin/patients";


  const [profile, setProfile] = useState<PatientProfile | null>(null);


  const [vitals, setVitals] = useState<any>({
    hr: [],
    spo2: [],
    steps: [],
    bp: [],
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
      const profileData = await getPatientProfile(patientId);


      if (!profileData) {
        toast.error("Patient not found");
        return;
      }


      setProfile(profileData);


      const startStr = format(startOfDay(startDate), "yyyy-MM-dd");
      const endStr = format(endOfDay(endDate), "yyyy-MM-dd");


      const { data: hrData, error: hrError } = await supabase
        .from("hr_day")
        .select("*")
        .eq("patient_id", patientId)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true });


      const { data: spo2Data, error: spo2Error } = await supabase
        .from("spo2_day")
        .select("*")
        .eq("patient_id", patientId)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true });


      const { data: stepsData, error: stepsError } = await supabase
        .from("steps_day")
        .select("*")
        .eq("patient_id", patientId)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true });


      const { data: bpData, error: bpError } = await supabase
        .from("bp_readings")
        .select("*")
        .eq("patient_id", patientId)
        .gte("reading_date", startStr)
        .lte("reading_date", endStr)
        .order("reading_date", { ascending: true })
        .order("reading_time", { ascending: true });


      if (hrError) console.error("HR Error:", hrError);
      if (spo2Error) console.error("SpO2 Error:", spo2Error);
      if (stepsError) console.error("Steps Error:", stepsError);
      if (bpError) console.error("BP Error:", bpError);


      const formattedHr =
        (hrData || [])
          .map((record: any) => ({
            fullDate: record.date,
            date: formatChartDate(record.date),
            min: toPositiveNumber(record.hr_min),
            avg: toPositiveNumber(record.hr_avg),
            max: toPositiveNumber(record.hr_max),
          }))
          .filter(
            (record) =>
              record.min !== null || record.avg !== null || record.max !== null
          ) || [];


      const formattedSpo2 =
        (spo2Data || [])
          .map((record: any) => ({
            fullDate: record.date,
            date: formatChartDate(record.date),
            min: toPositiveNumber(record.spo2_min),
            avg: toPositiveNumber(record.spo2_avg),
            max: toPositiveNumber(record.spo2_max),
          }))
          .filter(
            (record) =>
              record.min !== null || record.avg !== null || record.max !== null
          ) || [];


      const formattedSteps =
        (stepsData || [])
          .map((record: any) => ({
            fullDate: record.date,
            date: formatChartDate(record.date),
            count: toZeroOrPositiveNumber(
              record.steps_total ?? record.total_steps ?? record.steps
            ),
          }))
          .filter((record) => record.count !== null) || [];


      const formattedBp =
        (bpData || [])
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
            (record) =>
              record.systolic !== null ||
              record.diastolic !== null ||
              record.pulse !== null
          ) || [];


      setVitals({
        hr: formattedHr,
        spo2: formattedSpo2,
        steps: formattedSteps,
        bp: formattedBp,
      });
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch patient data");
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


  const patientName =
    profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        "Patient Details"
      : "Patient Details";


  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Patient Details"
              subtitle="View patient health charts, vitals and raw data logs."
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              onRefresh={refreshPatient}
              showExport={false}
            />


            {loading && !profile ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-medium">Loading patient details...</span>
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


                      <p className="mt-1 text-sm text-slate-500">
                        ID: {profile.patient_id}
                      </p>
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
                    <span className="text-sm font-semibold text-slate-600">
                      Quick Range:
                    </span>


                    <Button variant="outline" size="sm" onClick={() => setPreset(1)}>
                      1M
                    </Button>


                    <Button variant="outline" size="sm" onClick={() => setPreset(3)}>
                      3M
                    </Button>


                    <Button variant="outline" size="sm" onClick={() => setPreset(6)}>
                      6M
                    </Button>


                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setYearPreset(1)}
                    >
                      1Y
                    </Button>


                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setYearPreset(3)}
                    >
                      3Y
                    </Button>
                  </div>


                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">
                      Custom Range:
                    </span>


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
                          {dateRange?.from ? (
                            format(dateRange.from, "MMM dd, yyyy")
                          ) : (
                            <span>Start Date</span>
                          )}
                        </Button>
                      </PopoverTrigger>


                      <PopoverContent className="w-auto p-0" align="start">
                        <DateScrollPicker
                          date={dateRange?.from}
                          setDate={(date) =>
                            setDateRange((prev) => ({
                              ...prev,
                              from: date,
                              to: prev?.to,
                            }))
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
                          {dateRange?.to ? (
                            format(dateRange.to, "MMM dd, yyyy")
                          ) : (
                            <span>End Date</span>
                          )}
                        </Button>
                      </PopoverTrigger>


                      <PopoverContent className="w-auto p-0" align="start">
                        <DateScrollPicker
                          date={dateRange?.to}
                          setDate={(date) =>
                            setDateRange((prev) => ({
                              ...prev,
                              from: prev?.from,
                              to: date,
                            }))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>


                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-slate-900">Overview</h2>


                  {dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-slate-500">
                      {format(dateRange.from, "MMM d, yyyy")} -{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </p>
                  )}
                </div>


                <div ref={pdfRef} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Daily Steps</CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasStepsData(vitals.steps) ? (
                          <NoData message="No steps data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={vitals.steps}
                                margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />


                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <YAxis
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <Tooltip />


                                <Bar
                                  dataKey="count"
                                  fill="#2563eb"
                                  radius={[4, 4, 0, 0]}
                                  name="Steps"
                                  isAnimationActive={false}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>


                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">
                          Heart Rate (BPM)
                        </CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasHrData(vitals.hr) ? (
                          <NoData message="No heart rate data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={vitals.hr}
                                margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />


                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <YAxis
                                  domain={["dataMin - 10", "dataMax + 10"]}
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <Tooltip />
                                <Legend />


                                <Line
                                  type="monotone"
                                  dataKey="max"
                                  stroke="#dc2626"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }}
                                  activeDot={{ r: 8 }}
                                  name="Max"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="avg"
                                  stroke="#f97316"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#f97316" }}
                                  activeDot={{ r: 8 }}
                                  name="Avg"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="min"
                                  stroke="#16a34a"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }}
                                  activeDot={{ r: 8 }}
                                  name="Min"
                                  connectNulls
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>


                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">
                          Blood Pressure
                        </CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasBpData(vitals.bp) ? (
                          <NoData message="No blood pressure data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={vitals.bp}
                                margin={{ top: 20, right: 30, left: 5, bottom: 35 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />


                                <XAxis
                                  dataKey="time"
                                  tick={{ fontSize: 11, fill: "#334155" }}
                                  stroke="#64748b"
                                  angle={-15}
                                  textAnchor="end"
                                  height={50}
                                />


                                <YAxis
                                  domain={["dataMin - 10", "dataMax + 10"]}
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <Tooltip />
                                <Legend verticalAlign="top" />


                                <ReferenceLine
                                  y={120}
                                  label="Sys Limit"
                                  stroke="#dc2626"
                                  strokeDasharray="3 3"
                                />


                                <ReferenceLine
                                  y={80}
                                  label="Dia Limit"
                                  stroke="#64748b"
                                  strokeDasharray="3 3"
                                />


                                <Line
                                  type="monotone"
                                  dataKey="systolic"
                                  stroke="#dc2626"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }}
                                  activeDot={{ r: 8 }}
                                  name="Systolic"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="diastolic"
                                  stroke="#2563eb"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#2563eb" }}
                                  activeDot={{ r: 8 }}
                                  name="Diastolic"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="pulse"
                                  stroke="#16a34a"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }}
                                  activeDot={{ r: 8 }}
                                  name="Pulse"
                                  connectNulls
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>


                    <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">SpO₂ (%)</CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasSpo2Data(vitals.spo2) ? (
                          <NoData message="No SpO₂ data available for this period" />
                        ) : (
                          <div style={{ height: 300, minHeight: 300, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={vitals.spo2}
                                margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />


                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <YAxis
                                  domain={["dataMin - 2", "dataMax + 2"]}
                                  tick={{ fontSize: 12, fill: "#334155" }}
                                  stroke="#64748b"
                                />


                                <Tooltip />
                                <Legend />


                                <Line
                                  type="monotone"
                                  dataKey="max"
                                  stroke="#dc2626"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#dc2626" }}
                                  activeDot={{ r: 8 }}
                                  name="Max %"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="avg"
                                  stroke="#06b6d4"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#06b6d4" }}
                                  activeDot={{ r: 8 }}
                                  name="Avg %"
                                  connectNulls
                                  isAnimationActive={false}
                                />


                                <Line
                                  type="monotone"
                                  dataKey="min"
                                  stroke="#16a34a"
                                  strokeWidth={4}
                                  dot={{ r: 6, strokeWidth: 2, fill: "#16a34a" }}
                                  activeDot={{ r: 8 }}
                                  name="Min %"
                                  connectNulls
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>


                  <h3 className="text-xl font-bold text-slate-900">
                    Raw Data Logs
                  </h3>


                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="max-h-[360px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Steps Log</CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasStepsData(vitals.steps) ? (
                          <p className="py-4 text-center text-slate-500">No data</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-slate-700">Date</TableHead>
                                <TableHead className="text-slate-700">Count</TableHead>
                              </TableRow>
                            </TableHeader>


                            <TableBody>
                              {[...vitals.steps].reverse().map((record: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="text-slate-700">
                                    {record.fullDate}
                                  </TableCell>
                                  <TableCell className="text-slate-700">
                                    {record.count}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>


                    <Card className="max-h-[360px] overflow-auto border-slate-200 bg-white text-slate-900 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-900">BP Log</CardTitle>
                      </CardHeader>


                      <CardContent>
                        {!hasBpData(vitals.bp) ? (
                          <p className="py-4 text-center text-slate-500">No data</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-slate-700">Time</TableHead>
                                <TableHead className="text-slate-700">
                                  Sys/Dia
                                </TableHead>
                                <TableHead className="text-slate-700">Pulse</TableHead>
                              </TableRow>
                            </TableHeader>


                            <TableBody>
                              {[...vitals.bp].reverse().map((record: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="text-slate-700">
                                    {record.time}
                                  </TableCell>
                                  <TableCell className="text-slate-700">
                                    {record.systolic}/{record.diastolic}
                                  </TableCell>
                                  <TableCell className="text-slate-700">
                                    {record.pulse}
                                  </TableCell>
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


        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}

