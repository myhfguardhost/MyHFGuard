import { useEffect, useState, useRef } from "react";
import { generatePatientPdf } from "@/lib/pdf";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getPatientProfile, PatientProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { format, subMonths, subYears, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { DateScrollPicker } from "@/components/ui/date-scroll-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.state?.from || "/admin/patients";

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [vitals, setVitals] = useState<any>({ hr: [], spo2: [], steps: [], bp: [] });
  const [loading, setLoading] = useState(true);
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
      if (!profile) {
        const profileData = await getPatientProfile(patientId);
        if (!profileData) {
          toast.error("Patient not found");
          return;
        }
        setProfile(profileData);
      }

      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [hrRes, spo2Res, stepsRes, bpRes, hrSampleRes, spo2SampleRes, stepsEventRes] = await Promise.all([
        supabase
          .from("hr_day")
          .select("*")
          .eq("patient_id", patientId)
          .gte("date", startStr)
          .lte("date", endStr)
          .order("date", { ascending: false }),

        supabase
          .from("spo2_day")
          .select("*")
          .eq("patient_id", patientId)
          .gte("date", startStr)
          .lte("date", endStr)
          .order("date", { ascending: false }),

        supabase
          .from("steps_day")
          .select("*")
          .eq("patient_id", patientId)
          .gte("date", startStr)
          .lte("date", endStr)
          .order("date", { ascending: false }),

        supabase
          .from("bp_readings")
          .select("*")
          .eq("patient_id", patientId)
          .gte("reading_date", startStr)
          .lte("reading_date", endStr)
          .order("reading_date", { ascending: false })
          .order("reading_time", { ascending: false }),

        supabase
          .from("hr_sample")
          .select("*")
          .eq("patient_id", patientId)
          .gte("time_ts", startIso)
          .lte("time_ts", endIso),

        supabase
          .from("spo2_sample")
          .select("*")
          .eq("patient_id", patientId)
          .gte("time_ts", startIso)
          .lte("time_ts", endIso),

        supabase
          .from("steps_event")
          .select("*")
          .eq("patient_id", patientId)
          .gte("end_ts", startIso)
          .lte("end_ts", endIso),
      ]);

      if (hrRes.error) console.error("HR day error:", hrRes.error);
      if (spo2Res.error) console.error("SpO2 day error:", spo2Res.error);
      if (stepsRes.error) console.error("Steps day error:", stepsRes.error);
      if (bpRes.error) console.error("BP error:", bpRes.error);

      const toNumber = (...values: any[]) => {
        for (const value of values) {
          if (value === null || value === undefined || value === "") continue;
          const n = Number(value);
          if (Number.isFinite(n)) return n;
        }
        return null;
      };

      const dateOnly = (value: any) => {
        if (!value) return null;
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : format(d, "yyyy-MM-dd");
      };

      const formatDate = (d: string) =>
        new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      const aggregateSamples = (
        rows: any[],
        timeFields: string[],
        valueFields: string[],
        mode: "stats" | "sum"
      ) => {
        const grouped = new Map<string, number[]>();

        rows.forEach((row) => {
          const ts = timeFields.map((field) => row[field]).find(Boolean);
          const day = dateOnly(ts);
          const value = toNumber(...valueFields.map((field) => row[field]));

          if (!day || value === null) return;

          const arr = grouped.get(day) || [];
          arr.push(value);
          grouped.set(day, arr);
        });

        const result = new Map<string, any>();

        grouped.forEach((values, day) => {
          if (mode === "sum") {
            result.set(day, {
              count: values.reduce((sum, value) => sum + value, 0),
            });
          } else {
            result.set(day, {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((sum, value) => sum + value, 0) / values.length,
            });
          }
        });

        return result;
      };

      const dailyMap = (rows: any[], dateField: string) => {
        const map = new Map<string, any>();

        rows.forEach((row) => {
          const day = dateOnly(row[dateField]);
          if (day) map.set(day, row);
        });

        return map;
      };

      const hrData = hrRes.data || [];
      const spo2Data = spo2Res.data || [];
      const stepsData = stepsRes.data || [];
      const bpData = bpRes.data || [];

      const hrSamples = hrSampleRes.data || [];
      const spo2Samples = spo2SampleRes.data || [];
      const stepsEvents = stepsEventRes.data || [];

      const hrSampleByDate = aggregateSamples(
        hrSamples,
        ["time_ts", "time", "created_at"],
        ["bpm", "hr", "heart_rate", "value"],
        "stats"
      );

      const spo2SampleByDate = aggregateSamples(
        spo2Samples,
        ["time_ts", "time", "created_at"],
        ["spo2_pct", "spo2", "percentage", "oxygen", "value"],
        "stats"
      );

      const stepsEventByDate = aggregateSamples(
        stepsEvents,
        ["end_ts", "endTime", "time_ts", "created_at"],
        ["count", "steps", "steps_total", "value"],
        "sum"
      );

      const hrDayByDate = dailyMap(hrData, "date");
      const spo2DayByDate = dailyMap(spo2Data, "date");
      const stepsDayByDate = dailyMap(stepsData, "date");

      const allDates = eachDayOfInterval({ start, end });

      const newVitals = {
        hr: allDates.map((date) => {
          const day = format(date, "yyyy-MM-dd");
          const r = hrDayByDate.get(day) || {};
          const fallback = hrSampleByDate.get(day) || {};

          return {
            fullDate: day,
            date: formatDate(day),
            min: toNumber(r.hr_min, r.min, r.bpm_min, fallback.min),
            avg: toNumber(r.hr_avg, r.avg, r.bpm_avg, r.bpm, r.heart_rate, fallback.avg),
            max: toNumber(r.hr_max, r.max, r.bpm_max, fallback.max),
          };
        }),

        spo2: allDates.map((date) => {
          const day = format(date, "yyyy-MM-dd");
          const r = spo2DayByDate.get(day) || {};
          const fallback = spo2SampleByDate.get(day) || {};

          return {
            fullDate: day,
            date: formatDate(day),
            min: toNumber(r.spo2_min, r.min, r.oxygen_min, fallback.min),
            avg: toNumber(r.spo2_avg, r.avg, r.spo2_pct, r.spo2, r.oxygen, fallback.avg),
            max: toNumber(r.spo2_max, r.max, r.oxygen_max, fallback.max),
          };
        }),

        steps: allDates.map((date) => {
          const day = format(date, "yyyy-MM-dd");
          const r = stepsDayByDate.get(day) || {};
          const fallback = stepsEventByDate.get(day) || {};

          return {
            fullDate: day,
            date: formatDate(day),
            count: toNumber(r.steps_total, r.count, r.steps, fallback.count),
          };
        }),

        bp: bpData
          .map((r: any) => {
            const day = dateOnly(r.reading_date || r.date || r.created_at);
            const systolic = toNumber(r.systolic, r.sys, r.sbp, r.systolic_bp, r.latest_systolic);
            const diastolic = toNumber(r.diastolic, r.dia, r.dbp, r.diastolic_bp, r.latest_diastolic);
            const pulse = toNumber(r.pulse, r.pulse_rate, r.hr, r.heart_rate);

            if (!day || systolic === null || diastolic === null) return null;

            const rawTime = r.reading_time || r.time || (r.created_at ? format(new Date(r.created_at), "HH:mm") : "");
            const displayTime = rawTime ? String(rawTime).substring(0, 5) : "";

            return {
              fullDate: day,
              time: `${formatDate(day)}${displayTime ? ` ${displayTime}` : ""}`,
              systolic,
              diastolic,
              pulse,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate) || a.time.localeCompare(b.time)),
      };

      setVitals(newVitals);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch data");
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

  if (loading && !profile) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!profile && !loading) return null;

  const addSinglePointPadding = (data: any[], valueKeys: string[]) => {
    if (data.length !== 1) return data;

    const item = data[0];

    return [
      {
        ...item,
        date: item.date ? `${item.date} Start` : "",
        time: item.time ? `${item.time} Start` : "",
        ...Object.fromEntries(valueKeys.map((key) => [key, null])),
      },
      item,
      {
        ...item,
        date: item.date ? `${item.date} End` : "",
        time: item.time ? `${item.time} End` : "",
        ...Object.fromEntries(valueKeys.map((key) => [key, null])),
      },
    ];
  };

  const stepsChartDataRaw = vitals.steps.filter((r: any) => r.count !== null && r.count !== undefined);
  const hrChartDataRaw = vitals.hr.filter((r: any) => r.avg !== null || r.min !== null || r.max !== null);
  const spo2ChartDataRaw = vitals.spo2.filter((r: any) => r.avg !== null || r.min !== null || r.max !== null);
  const bpChartDataRaw = vitals.bp;

  const stepsChartData = addSinglePointPadding(stepsChartDataRaw, ["count"]);
  const hrChartData = addSinglePointPadding(hrChartDataRaw, ["min", "avg", "max"]);
  const spo2ChartData = addSinglePointPadding(spo2ChartDataRaw, ["avg"]);
  const bpChartData = vitals.bp.filter((r: any) => {
    return (
      Number.isFinite(Number(r.systolic)) &&
      Number.isFinite(Number(r.diastolic)) &&
      Number(r.systolic) > 0 &&
      Number(r.diastolic) > 0
    );
  });

  const hasSteps = stepsChartDataRaw.length > 0;
  const hasHr = hrChartDataRaw.length > 0;
  const hasSpo2 = spo2ChartDataRaw.length > 0;
  const hasBp = bpChartDataRaw.length > 0;

  const strongTooltip = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #94a3b8",
    color: "#0f172a",
  };

  const getBpDomain = () => {
      const values = bpChartData.flatMap((r: any) =>
        [r.systolic, r.diastolic, r.pulse].filter((v) => v !== null && v !== undefined)
      );

      if (values.length === 0) return [40, 180];

      return [
        Math.max(30, Math.min(...values) - 10),
        Math.max(...values) + 10,
      ];
    };

  return (
    <>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (profile && pdfRef.current) {
                generatePatientPdf(profile, pdfRef.current);
              }
            }}
          >
            Download PDF
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(backPath)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-muted-foreground">ID: {profile?.patient_id}</p>
            </div>
          </div>

          <Button
            onClick={() => id && dateRange?.from && dateRange?.to && fetchData(id, dateRange.from, dateRange.to)}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Range:</span>
            <Button variant="outline" size="sm" onClick={() => setPreset(1)}>1M</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset(3)}>3M</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset(6)}>6M</Button>
            <Button variant="outline" size="sm" onClick={() => setYearPreset(1)}>1Y</Button>
            <Button variant="outline" size="sm" onClick={() => setYearPreset(3)}>3Y</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Custom Range:</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[140px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : <span>Start Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DateScrollPicker
                  date={dateRange?.from}
                  setDate={(date) => setDateRange((prev) => ({ ...prev, from: date, to: prev?.to }))}
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">-</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[140px] justify-start text-left font-normal", !dateRange?.to && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : <span>End Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DateScrollPicker
                  date={dateRange?.to}
                  setDate={(date) => setDateRange((prev) => ({ ...prev, from: prev?.from, to: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <h2 className="text-2xl font-bold">
          Overview
          {dateRange?.from && dateRange?.to && (
            <span className="text-muted-foreground font-normal text-lg ml-2">
              ({format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")})
            </span>
          )}
        </h2>

        <div ref={pdfRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Steps</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasSteps ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No steps data available for this period
                  </div>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stepsChartData}>
                        <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="#334155" />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} stroke="#334155" />
                        <Tooltip
                          contentStyle={strongTooltip}
                          labelStyle={{ color: "#0f172a", fontWeight: "bold", marginBottom: "4px" }}
                          cursor={{ fill: "#dbeafe" }}
                        />
                        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Steps" minPointSize={18} maxBarSize={90} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heart Rate (BPM)</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasHr ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No heart rate data available for this period
                  </div>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hrChartData}>
                        <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="#334155" />
                        <YAxis domain={["dataMin - 10", "dataMax + 10"]} fontSize={12} tickLine={false} axisLine={false} stroke="#334155" />
                        <Tooltip contentStyle={strongTooltip} labelStyle={{ color: "#0f172a", fontWeight: "bold" }} />
                        <Legend />
                        <Line type="linear" dataKey="max" stroke="#dc2626" strokeWidth={5} dot={{ r: 8, fill: "#dc2626" }} activeDot={{ r: 10 }} name="Max" connectNulls />
                        <Line type="linear" dataKey="avg" stroke="#ea580c" strokeWidth={5} dot={{ r: 8, fill: "#ea580c" }} activeDot={{ r: 10 }} name="Avg" connectNulls />
                        <Line type="linear" dataKey="min" stroke="#16a34a" strokeWidth={5} dot={{ r: 8, fill: "#16a34a" }} activeDot={{ r: 10 }} name="Min" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blood Pressure</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasBp ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No blood pressure data available for this period
                  </div>
                ) : (
                <div className="h-[360px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart
                      data={bpChartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
                    >
                      <CartesianGrid stroke="#94a3b8" strokeDasharray="3 3" />

                      <XAxis
                        dataKey="time"
                        fontSize={12}
                        tickLine={true}
                        axisLine={true}
                        stroke="#0f172a"
                        tick={{ fill: "#0f172a", fontWeight: 600 }}
                      />

                      <YAxis
                        domain={getBpDomain()}
                        fontSize={12}
                        tickLine={true}
                        axisLine={true}
                        stroke="#0f172a"
                        tick={{ fill: "#0f172a", fontWeight: 600 }}
                        allowDecimals={false}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #0f172a",
                          color: "#0f172a",
                        }}
                        labelStyle={{ color: "#0f172a", fontWeight: "bold" }}
                      />

                      <Legend />

                      <ReferenceLine y={120} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" />
                      <ReferenceLine y={80} stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />

                      <Line
                        type="linear"
                        dataKey="systolic"
                        stroke="#dc2626"
                        strokeWidth={6}
                        dot={{ r: 10, fill: "#dc2626", stroke: "#ffffff", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        name="Systolic"
                        connectNulls
                        isAnimationActive={false}
                      />

                      <Line
                        type="linear"
                        dataKey="diastolic"
                        stroke="#2563eb"
                        strokeWidth={6}
                        dot={{ r: 10, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        name="Diastolic"
                        connectNulls
                        isAnimationActive={false}
                      />

                      <Line
                        type="linear"
                        dataKey="pulse"
                        stroke="#f97316"
                        strokeWidth={6}
                        dot={{ r: 10, fill: "#f97316", stroke: "#ffffff", strokeWidth: 2 }}
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

            <Card>
              <CardHeader>
                <CardTitle>SpO2 (%)</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasSpo2 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No SpO2 data available for this period
                  </div>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spo2ChartData}>
                        <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="#334155" />
                        <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={12} tickLine={false} axisLine={false} stroke="#334155" />
                        <Tooltip contentStyle={strongTooltip} labelStyle={{ color: "#0f172a", fontWeight: "bold" }} />
                        <Line type="linear" dataKey="avg" stroke="#0891b2" strokeWidth={5} dot={{ r: 8, fill: "#0891b2" }} activeDot={{ r: 10 }} name="Avg %" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <h3 className="text-xl font-bold mt-12">Raw Data Logs</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="max-h-[300px] overflow-auto">
              <CardHeader>
                <CardTitle>Steps Log</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasSteps ? (
                  <p className="text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...stepsChartData].reverse().map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{r.fullDate}</TableCell>
                          <TableCell>{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="max-h-[300px] overflow-auto">
              <CardHeader>
                <CardTitle>BP Log</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasBp ? (
                  <p className="text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Sys/Dia</TableHead>
                        <TableHead>Pulse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...bpChartData].reverse().map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{r.time}</TableCell>
                          <TableCell>{r.systolic}/{r.diastolic}</TableCell>
                          <TableCell>{r.pulse ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}