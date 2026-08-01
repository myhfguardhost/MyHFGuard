import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  Star,
  Target,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { getAdminPatientFullData, getPatients, serverUrl } from "@/lib/api";
import { buildAlerts, pickWorstStatus } from "@/lib/adminAlertUtils";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function valueOf(row: any, keys: string[]) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return null;
}

function latestBy(rows: any[], getter: (row: any) => any) {
  return [...(rows || [])]
    .filter(Boolean)
    .sort((a, b) => {
      const ta = new Date(getter(a) || 0).getTime();
      const tb = new Date(getter(b) || 0).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    })[0] || null;
}

function getName(patient: any, fallbackId: string) {
  return `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim() || patient?.full_name || fallbackId;
}

function normalizeVitals(fullData: any) {
  const vitals = fullData?.vitals || {};
  const hr = vitals.hr || [];
  const spo2 = vitals.spo2 || [];
  const steps = vitals.steps || [];
  const bp = vitals.bp || [];
  const weight = vitals.weight || [];
  const weightSamples = vitals.weightSamples || [];

  return {
    vitals: {
      hr: hr.map((row: any) => ({
        time: row.date,
        min: Math.round(Number(row.hr_min || 0)),
        avg: Math.round(Number(row.hr_avg || 0)),
        max: Math.round(Number(row.hr_max || 0)),
      })),
      spo2: spo2.map((row: any) => ({
        time: row.date,
        min: Math.round(Number(row.spo2_min || 0)),
        avg: Math.round(Number(row.spo2_avg || 0)),
        max: Math.round(Number(row.spo2_max || 0)),
      })),
      steps: steps.map((row: any) => ({
        time: row.date,
        count: Math.round(Number(row.steps_total ?? row.total_steps ?? row.steps ?? 0)),
      })),
      bp: bp.map((row: any) => ({
        time: `${row.reading_date || ""}T${row.reading_time || "00:00:00"}`,
        systolic: Number(row.systolic ?? row.bp_systolic ?? row.sys ?? 0),
        diastolic: Number(row.diastolic ?? row.bp_diastolic ?? row.dia ?? 0),
        pulse: Number(row.pulse ?? row.bp_pulse ?? 0),
      })),
      weight: (weight.length > 0 ? weight : weightSamples).map((row: any) => ({
        time: row.date || row.time_ts,
        value: Number(row.kg_avg ?? row.kg ?? row.value ?? 0),
      })),
    },
  };
}

function latestSymptomScore(rows: any[]) {
  const latest = latestBy(rows, (row) => row.date || row.time_ts || row.created_at);
  if (!latest) return "-";
  return (
    Number(latest.sob_activity || latest.breathlessness || 0) +
    Number(latest.leg_swelling || latest.swelling || 0) +
    Number(latest.orthopnea || latest.sleeping || 0) +
    Number(latest.cough || 0) +
    Number(latest.abd_discomfort || latest.abdomen || 0)
  );
}

const EXERCISE_GOAL_LABELS: Record<string, string> = {
  goalBetterSleep: "Better sleep",
  goalBoostedEnergy: "Boosted energy",
  goalWalkWithEase: "Walk with ease",
  goalLessPain: "Less pain",
  goalFeelBetter: "Feel better",
  goalReducedBreathlessness: "Less breathlessness",
  goalLessFatigue: "Less fatigue",
  goalMoreHouseEnergy: "Energy at home",
  goalMoreSocialEnergy: "Social energy",
  goalImprovedAppetite: "Better appetite",
};

function exerciseGoalLabel(goal: any) {
  const key = String(goal || "");
  return EXERCISE_GOAL_LABELS[key] || key || "-";
}

function exerciseRows(item: any) {
  return [...(item?.fullData?.exerciseGoals || [])].sort((a: any, b: any) =>
    String(b?.week_key || "").localeCompare(String(a?.week_key || ""))
  );
}

function currentExerciseWeekKey() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  local.setDate(local.getDate() - local.getDay());
  return dateKey(local);
}

export default function AdminReports() {
  const API = serverUrl();
  const reportRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDateTime = (value: any) => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  async function fetchReports() {
    try {
      setLoading(true);
      setError("");

      const patientsData = await getPatients();
      const patientRows = [...(patientsData.patients || [])].sort((a: any, b: any) => {
        return getDateTime(b.created_at) - getDateTime(a.created_at);
      });

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const startDate = dateKey(start);
      const endDate = dateKey(end);

      const detailed = await Promise.all(
        patientRows.map(async (patient: any) => {
          const patientId = patient.patient_id;

          const [fullData, weeklyStatusRes] = await Promise.all([
            getAdminPatientFullData(patientId, startDate, endDate).catch((e) => ({
              patientId,
              patient,
              summary: {},
              vitals: { hr: [], spo2: [], steps: [], distance: [], bp: [], weight: [], weightSamples: [] },
              logs: { symptoms: [], waterSalt: [], medications: [], reminders: [] },
              exerciseGoals: [],
              devices: [],
              profile: null,
              deviceSync: [],
              errors: { fullData: e.message },
            })),
            fetch(`${API}/patient/weekly-status?patientId=${patientId}`).then((r) =>
              r.ok ? r.json() : null
            ),
          ]);

          const patientInfo = { patient: fullData.patient || patient };
          const summaryData = { summary: fullData.summary || {} };
          const vitalsData = normalizeVitals(fullData);

          const alerts = buildAlerts({
            patientId,
            summaryData,
            vitalsData,
            weeklyStatus: weeklyStatusRes,
            symptomLogs: fullData?.logs?.symptoms || [],
            demoMode: false,
          });

          return {
            patientId,
            patientInfo,
            summaryData,
            vitalsData,
            fullData,
            weeklyStatus: weeklyStatusRes,
            alerts,
            status: pickWorstStatus(alerts),
            createdAt:
              patient.created_at ||
              fullData.patient?.created_at ||
              fullData.profile?.created_at ||
              "",
          };
        })
      );

      detailed.sort((a: any, b: any) => getDateTime(b.createdAt) - getDateTime(a.createdAt));
      setSummary(detailed);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function exportPDF() {
    try {
      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#eef2f7",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 45;

      pdf.setFontSize(16);
      pdf.text("MyHFGuard Admin Report", 20, 25);
      pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 45;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 45;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("admin_reports.pdf");
      toast.success("PDF report downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  }

  function exportExcel() {
    const rows = summary.map((item) => {
      const patient = item.patientInfo?.patient || {};
      const s = item.summaryData?.summary || {};
      const logs = item.fullData?.logs || {};
      const latestWaterSalt = latestBy(logs.waterSalt || [], (row) => row.entry_date || row.date || row.created_at);
      const goals = exerciseRows(item);
      const latestGoal = goals[0] || null;
      const latestRatedGoal = goals.find((row: any) => Number(row?.achievement_rating) >= 1 && Number(row?.achievement_rating) <= 5) || null;

      return {
        "Patient ID": item.patientId,
        Name: getName(patient, item.patientId),
        "SpO2": s.spo2 ?? "",
        "BP Systolic": s.bpSystolic ?? "",
        "BP Diastolic": s.bpDiastolic ?? "",
        "Steps Today": s.stepsToday ?? "",
        "Latest Steps": s.latestSteps ?? "",
        "Latest Weight": s.weightKg ?? "",
        "Water Intake (ml)": valueOf(latestWaterSalt, ["water_intake_ml", "water_intake"]) ?? "",
        "Salt Score": valueOf(latestWaterSalt, ["salt_score", "salt_intake"]) ?? "",
        "Symptom Score": latestSymptomScore(logs.symptoms || []),
        "Latest Exercise Goal": latestGoal ? exerciseGoalLabel(latestGoal.goal) : "",
        "Latest Goal Week": latestGoal?.week_key || "",
        "Latest Rated Goal": latestRatedGoal ? exerciseGoalLabel(latestRatedGoal.goal) : "",
        "Rated Goal Week": latestRatedGoal?.week_key || "",
        "Achievement Rating (1-5)": latestRatedGoal?.achievement_rating ?? "",
        "Last Sync": s.lastSyncTs ?? "",
        Status: item.status,
        "Primary Alert": item.alerts?.[0]?.title || "",
        "Alert Detail": item.alerts?.[0]?.message || "",
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Admin Reports");
    XLSX.writeFile(wb, "admin_reports_full_patient_data.xlsx");
    toast.success("Excel report downloaded");
  }

  const reportData = useMemo(() => {
    let spo2Total = 0;
    let spo2Count = 0;
    let hrTotal = 0;
    let hrCount = 0;
    let weightTotal = 0;
    let weightCount = 0;

    let stable = 0;
    let warning = 0;
    let critical = 0;

    summary.forEach((item) => {
      const s = item.summaryData?.summary || {};
      const latestSpo2 = Number(s.spo2);
      const latestWeight = Number(s.weightKg);
      const hr = Number(s.heartRate);

      if (!Number.isNaN(latestSpo2) && latestSpo2 > 0) {
        spo2Total += latestSpo2;
        spo2Count++;
      }

      if (!Number.isNaN(hr) && hr > 0) {
        hrTotal += hr;
        hrCount++;
      }

      if (!Number.isNaN(latestWeight) && latestWeight > 0) {
        weightTotal += latestWeight;
        weightCount++;
      }

      if (item.status === "critical") critical++;
      else if (item.status === "warning") warning++;
      else stable++;
    });

    return {
      totalPatients: summary.length,
      avgSpo2: spo2Count ? Math.round(spo2Total / spo2Count) : "-",
      avgHeartRate: hrCount ? Math.round(hrTotal / hrCount) : "-",
      avgWeight: weightCount ? (weightTotal / weightCount).toFixed(1) : "-",
      stable,
      warning,
      critical,
    };
  }, [summary]);

  const alertData = useMemo(() => {
    const hasAlert = (item: any, keywords: string[]) => {
      return (item.alerts || []).some((alert: any) => {
        const text = `${alert.title || ""} ${alert.message || ""}`.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword));
      });
    };

    return {
      bp: summary.filter((item) =>
        hasAlert(item, ["blood pressure", "bp", "systolic", "diastolic", "pulse"])
      ).length,

      weight: summary.filter((item) =>
        hasAlert(item, ["weight", "kg"])
      ).length,

      spo2: summary.filter((item) =>
        hasAlert(item, ["spo2", "spo₂", "oxygen"])
      ).length,

      symptoms: summary.filter((item) =>
        hasAlert(item, ["symptom", "breathless", "swelling", "cough", "abdomen"])
      ).length,

      steps: summary.filter((item) =>
        hasAlert(item, ["steps", "activity"])
      ).length,

      missingLogs: summary.filter((item) =>
        hasAlert(item, ["missing", "log"])
      ).length,
    };
  }, [summary]);

  const exerciseAnalytics = useMemo(() => {
    const currentWeek = currentExerciseWeekKey();
    const allRows = summary.flatMap((item) => {
      const patient = item.patientInfo?.patient || {};
      return exerciseRows(item).map((row: any) => ({
        ...row,
        patientId: item.patientId,
        patientName: getName(patient, item.patientId),
      }));
    });

    const ratedRows = allRows.filter((row: any) => {
      const rating = Number(row?.achievement_rating);
      return rating >= 1 && rating <= 5;
    });
    const completedRows = allRows.filter((row: any) => String(row?.week_key || "") < currentWeek);
    const pendingRows = completedRows.filter((row: any) => {
      const rating = Number(row?.achievement_rating);
      return !(rating >= 1 && rating <= 5);
    });

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratedRows.filter((row: any) => Number(row.achievement_rating) === rating).length,
    }));

    const goalCounts = new Map<string, number>();
    allRows.forEach((row: any) => {
      const key = String(row?.goal || "");
      if (!key) return;
      goalCounts.set(key, (goalCounts.get(key) || 0) + 1);
    });
    const popularGoals = [...goalCounts.entries()]
      .map(([goal, count]) => ({ goal, label: exerciseGoalLabel(goal), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 5);

    const totalRating = ratedRows.reduce((sum: number, row: any) => sum + Number(row.achievement_rating), 0);
    const patientsWithGoals = summary.filter((item) => exerciseRows(item).length > 0).length;

    return {
      allRows,
      ratedRows,
      pendingRows,
      distribution,
      popularGoals,
      averageRating: ratedRows.length ? (totalRating / ratedRows.length).toFixed(1) : "-",
      patientsWithGoals,
      mostSelectedGoal: popularGoals[0]?.label || "-",
    };
  }, [summary]);

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Reports"
              subtitle="Patient reports calculated from the latest 7 days of app, website and smart band data."
              onRefresh={fetchReports}
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              showExport={false}
            />

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Report Export</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Export PDF and Excel reports using complete patient records.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <FileText size={17} />
                    Export PDF
                  </button>

                  <button
                    onClick={exportExcel}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <FileSpreadsheet size={17} />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div ref={reportRef}>
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="font-medium">Loading complete report data...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                      <h2 className="mb-4 font-bold text-slate-900">Patient Status Overview</h2>
                      <div className="space-y-4">
                        <Bar label="Stable Patients" value={reportData.stable} total={reportData.totalPatients} />
                        <Bar label="Warning Patients" value={reportData.warning} total={reportData.totalPatients} />
                        <Bar label="Critical Patients" value={reportData.critical} total={reportData.totalPatients} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                      <h2 className="mb-1 font-bold text-slate-900">Patient Alert Distribution</h2>
                      <p className="mb-4 text-sm text-slate-500">
                        Number of patients triggered by each alert category.
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          ["Blood Pressure", alertData.bp, "BP"],
                          ["Weight", alertData.weight, "KG"],
                          ["SpO₂", alertData.spo2, "O₂"],
                          ["Symptoms", alertData.symptoms, "SYM"],
                          ["Steps", alertData.steps, "STEP"],
                          ["Missing Logs", alertData.missingLogs, "MISS"],
                        ].map(([label, value, tag]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">{tag}</span>
                              <span className="text-2xl font-bold text-blue-600">{value}</span>
                            </div>

                            <p className="text-sm font-semibold text-slate-800">{label} Alerts</p>

                            <div className="mt-3 h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    reportData.totalPatients > 0
                                      ? (Number(value) / reportData.totalPatients) * 100
                                      : 0
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h2 className="font-bold text-slate-900">Exercise Target Goal Achievement</h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Weekly goals selected by patients and their 1–5 achievement ratings saved in Supabase.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ExerciseMetricCard
                        label="Patients With Goals"
                        value={exerciseAnalytics.patientsWithGoals}
                        detail={`${reportData.totalPatients} total patients`}
                      />
                      <ExerciseMetricCard
                        label="Average Achievement"
                        value={exerciseAnalytics.averageRating === "-" ? "-" : `${exerciseAnalytics.averageRating}/5`}
                        detail={`${exerciseAnalytics.ratedRows.length} ratings submitted`}
                      />
                      <ExerciseMetricCard
                        label="Pending Past-Week Ratings"
                        value={exerciseAnalytics.pendingRows.length}
                        detail="Completed weeks without a rating"
                      />
                      <ExerciseMetricCard
                        label="Most Selected Goal"
                        value={exerciseAnalytics.mostSelectedGoal}
                        detail="Across the latest 12 goal records per patient"
                        compact
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900">Achievement Rating Distribution</h3>
                        <p className="mt-1 text-xs text-slate-500">1 = not achieved, 5 = fully achieved</p>
                        <div className="mt-4 space-y-3">
                          {exerciseAnalytics.distribution.map((entry) => {
                            const maximum = Math.max(1, ...exerciseAnalytics.distribution.map((item) => item.count));
                            return (
                              <div key={entry.rating}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2 font-medium text-slate-700">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    Rating {entry.rating}
                                  </span>
                                  <span className="font-semibold text-slate-900">{entry.count}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-200">
                                  <div
                                    className="h-2.5 rounded-full bg-amber-400"
                                    style={{ width: `${(entry.count / maximum) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900">Most Selected Target Goals</h3>
                        <p className="mt-1 text-xs text-slate-500">Selection frequency from recent weekly records</p>
                        <div className="mt-4 space-y-3">
                          {exerciseAnalytics.popularGoals.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">No exercise goals recorded yet.</p>
                          ) : (
                            exerciseAnalytics.popularGoals.map((entry) => {
                              const maximum = Math.max(1, exerciseAnalytics.popularGoals[0]?.count || 1);
                              return (
                                <div key={entry.goal}>
                                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-slate-700">{entry.label}</span>
                                    <span className="font-semibold text-slate-900">{entry.count}</span>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-slate-200">
                                    <div
                                      className="h-2.5 rounded-full bg-blue-500"
                                      style={{ width: `${(entry.count / maximum) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-[1050px] w-full text-sm text-slate-900">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Patient</th>
                            <th className="px-4 py-3 text-left font-semibold">Latest Target Goal</th>
                            <th className="px-4 py-3 text-left font-semibold">Goal Week</th>
                            <th className="px-4 py-3 text-left font-semibold">Latest Rated Goal</th>
                            <th className="px-4 py-3 text-left font-semibold">Rated Week</th>
                            <th className="px-4 py-3 text-left font-semibold">Achievement</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white text-slate-800">
                          {summary.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                No patient goal records found.
                              </td>
                            </tr>
                          ) : (
                            summary.map((item, index) => {
                              const patient = item.patientInfo?.patient || {};
                              const goals = exerciseRows(item);
                              const latestGoal = goals[0] || null;
                              const latestRatedGoal = goals.find((row: any) => {
                                const rating = Number(row?.achievement_rating);
                                return rating >= 1 && rating <= 5;
                              }) || null;

                              return (
                                <tr key={`exercise-${item.patientId || index}`} className="border-b border-slate-200 hover:bg-slate-50">
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">{getName(patient, item.patientId)}</div>
                                    <div className="mt-0.5 text-xs text-slate-500">{item.patientId}</div>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    {latestGoal ? exerciseGoalLabel(latestGoal.goal) : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{latestGoal?.week_key || "-"}</td>
                                  <td className="px-4 py-3 text-slate-700">
                                    {latestRatedGoal ? exerciseGoalLabel(latestRatedGoal.goal) : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{latestRatedGoal?.week_key || "-"}</td>
                                  <td className="px-4 py-3">
                                    <ExerciseRating rating={latestRatedGoal?.achievement_rating} />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                    <h2 className="mb-4 font-bold text-slate-900">Complete Patient Report Table</h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-[950px] w-full text-sm text-slate-900">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Patient ID</th>
                            <th className="px-4 py-3 text-left font-semibold">Name</th>
                            <th className="px-4 py-3 text-left font-semibold">SpO₂</th>
                            <th className="px-4 py-3 text-left font-semibold">BP</th>
                            <th className="px-4 py-3 text-left font-semibold">Steps</th>
                            <th className="px-4 py-3 text-left font-semibold">Weight</th>
                            <th className="px-4 py-3 text-left font-semibold">Water/Salt</th>
                            <th className="px-4 py-3 text-left font-semibold">Symptoms</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>

                        <tbody className="bg-white text-slate-800">
                          {summary.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                No report data found.
                              </td>
                            </tr>
                          ) : (
                            summary.map((item, index) => {
                              const patient = item.patientInfo?.patient || {};
                              const s = item.summaryData?.summary || {};
                              const logs = item.fullData?.logs || {};
                              const latestWaterSalt = latestBy(logs.waterSalt || [], (row) => row.entry_date || row.date || row.created_at);
                              const water = valueOf(latestWaterSalt, ["water_intake_ml", "water_intake"]);
                              const salt = valueOf(latestWaterSalt, ["salt_score", "salt_intake"]);

                              return (
                                <tr key={item.patientId || index} className="border-b border-slate-200 text-slate-800 hover:bg-slate-50">
                                  <td className="break-all px-4 py-3 text-slate-700">{item.patientId}</td>
                                  <td className="px-4 py-3 font-medium text-slate-900">{getName(patient, item.patientId)}</td>
                                  <td className="px-4 py-3 text-slate-700">{s.spo2 ? `${s.spo2}%` : "-"}</td>
                                  <td className="px-4 py-3 text-slate-700">{s.bpSystolic && s.bpDiastolic ? `${s.bpSystolic}/${s.bpDiastolic}` : "-"}</td>
                                  <td className="px-4 py-3 text-slate-700">{s.stepsToday ?? s.latestSteps ?? "-"}</td>
                                  <td className="px-4 py-3 text-slate-700">{s.weightKg ? `${s.weightKg} kg` : "-"}</td>
                                  <td className="px-4 py-3 text-slate-700">{water ? `${water} ml` : "-"}{salt ? ` / Salt ${salt}` : ""}</td>
                                  <td className="px-4 py-3 text-slate-700">{latestSymptomScore(logs.symptoms || [])}</td>
                                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}

function ExerciseMetricCard({ label, value, detail, compact = false }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 font-bold text-slate-900 ${compact ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ExerciseRating({ rating }: { rating?: number | null }) {
  const value = Number(rating);
  if (!(value >= 1 && value <= 5)) {
    return <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Pending</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {value}/5
    </span>
  );
}

function Bar({ label, value, total }: any) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const style =
    status === "critical"
      ? "bg-red-100 text-red-700 border-red-200"
      : status === "warning"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style}`}>
      {status || "stable"}
    </span>
  );
}