import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CircleAlert,
  Loader2,
  Mail,
  Search,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";


import {
  getAdminPatientFullData,
  getPatients,
  serverUrl,
} from "@/lib/api";
import { buildAlerts } from "@/lib/adminAlertUtils";


import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

type AlertRecordTime = {
  value: string;
  dateOnly: boolean;
  label: "Latest record" | "Status checked";
};

type DateCandidate = {
  value: string;
  dateOnly: boolean;
  timestamp: number;
};

function toDateCandidate(value: any): DateCandidate | null {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const parsed = new Date(dateOnly ? `${text}T12:00:00` : text);
  const timestamp = parsed.getTime();

  if (Number.isNaN(timestamp)) return null;

  return { value: text, dateOnly, timestamp };
}

function newestCandidate(candidates: Array<DateCandidate | null>) {
  return candidates
    .filter((candidate): candidate is DateCandidate => Boolean(candidate))
    .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
}

function latestRowTime(rows: any[], getValue: (row: any) => any) {
  if (!Array.isArray(rows)) return null;
  return newestCandidate(rows.map((row) => toDateCandidate(getValue(row))));
}

function getAlertRecordTime(
  fullData: any,
  alertId: string,
  evaluatedAt: string
): AlertRecordTime {
  const vitals = fullData?.vitals || {};
  const logs = fullData?.logs || {};

  const latestHr = latestRowTime(vitals.hr || [], (row) => row.date);
  const latestSpo2 = latestRowTime(vitals.spo2 || [], (row) => row.date);
  const latestSteps = latestRowTime(vitals.steps || [], (row) => row.date);
  const latestBp = latestRowTime(vitals.bp || [], (row) => {
    const date = row.reading_date || row.date;
    if (!date) return row.created_at || row.time_ts;
    return row.reading_time ? `${date}T${row.reading_time}` : date;
  });
  const latestWeight = newestCandidate([
    latestRowTime(vitals.weight || [], (row) => row.date || row.created_at),
    latestRowTime(
      vitals.weightSamples || [],
      (row) => row.time_ts || row.created_at || row.date
    ),
  ]);
  const latestSymptom = latestRowTime(
    logs.symptoms || [],
    (row) => row.logged_at || row.time_ts || row.created_at || row.date
  );

  const latestOverall = newestCandidate([
    latestHr,
    latestSpo2,
    latestSteps,
    latestBp,
    latestWeight,
    latestSymptom,
  ]);

  let selected: DateCandidate | null = null;

  if (alertId.startsWith("bp-") || alertId.startsWith("baseline-bp")) {
    selected = latestBp;
  } else if (alertId.startsWith("hr-")) {
    selected = latestHr;
  } else if (alertId.startsWith("spo2-")) {
    selected = latestSpo2;
  } else if (
    alertId.startsWith("weight-") ||
    alertId.startsWith("baseline-weight")
  ) {
    selected = latestWeight;
  } else if (alertId.startsWith("symptom-")) {
    selected = latestSymptom;
  } else if (alertId === "steps-warning") {
    selected = latestSteps;
  }

  // Missing-log alerts describe the status at the moment the page is refreshed,
  // rather than a historical patient/account timestamp.
  if (alertId.startsWith("missing-")) {
    return {
      value: evaluatedAt,
      dateOnly: false,
      label: "Status checked",
    };
  }

  const resolved = selected || latestOverall || toDateCandidate(evaluatedAt)!;

  return {
    value: resolved.value,
    dateOnly: resolved.dateOnly,
    label: "Latest record",
  };
}


export default function AdminAlerts() {
  const navigate = useNavigate();
  const API = serverUrl();


  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");


  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const getDateTime = (value: any) => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };


  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPatients();

      const patientRows = [...(data.patients || [])].sort((a: any, b: any) => {
        return getDateTime(b.created_at) - getDateTime(a.created_at);
      });


      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const startDate = dateKey(start);
      const endDate = dateKey(end);

      const allAlerts = await Promise.all(
        patientRows.map(async (patient: any) => {
          const patientId = patient.patient_id;

          const [fullData, weeklyStatusRes] = await Promise.all([
            getAdminPatientFullData(patientId, startDate, endDate).catch((e) => ({
              patientId,
              patient,
              summary: {},
              vitals: { hr: [], spo2: [], steps: [], distance: [], bp: [], weight: [], weightSamples: [] },
              logs: { symptoms: [], waterSalt: [], medications: [], reminders: [] },
              devices: [],
              profile: null,
              deviceSync: [],
              errors: { fullData: e.message },
            })),
            fetch(
              `${API}/patient/weekly-status?patientId=${encodeURIComponent(
                patientId
              )}&endDate=${encodeURIComponent(endDate)}`
            ).then((r) => (r.ok ? r.json() : null)),
          ]);

          const patientInfo = fullData?.patient || fullData?.profile || patient;
          const patientName =
            `${patientInfo?.first_name || ""} ${patientInfo?.last_name || ""}`.trim() ||
            patientInfo?.full_name ||
            patientInfo?.name ||
            patient.full_name ||
            patient.name ||
            "Unknown Patient";

          const evaluatedAt = new Date().toISOString();

          const patientAlerts = buildAlerts({
            patientId,
            summaryData: { summary: fullData?.summary || {} },
            vitalsData: normalizeVitals(fullData),
            weeklyStatus: weeklyStatusRes,
            symptomLogs: fullData?.logs?.symptoms || [],
            demoMode: false,
          });

          return patientAlerts
            .filter((alert: any) => alert.level !== "stable")
            .map((alert: any) => {
              const recordTime = getAlertRecordTime(
                fullData,
                String(alert.id || ""),
                evaluatedAt
              );

              return {
                ...alert,
                alertKey: `${patientId}-${alert.id}`,
                patientId,
                patientName,
                createdAt: recordTime.value,
                dateOnly: recordTime.dateOnly,
                timeLabel: recordTime.label,
              };
            });
        })
      );


      const levelRank: Record<string, number> = {
        critical: 2,
        warning: 1,
        stable: 0,
      };

      const flattened = allAlerts.flat().sort((a: any, b: any) => {
        const timeDifference =
          getDateTime(b.createdAt) - getDateTime(a.createdAt);

        if (timeDifference !== 0) return timeDifference;

        const levelDifference =
          (levelRank[b.level] || 0) - (levelRank[a.level] || 0);

        if (levelDifference !== 0) return levelDifference;

        return String(a.patientName || "").localeCompare(
          String(b.patientName || "")
        );
      });


      setAlerts(flattened);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };


  const filteredAlerts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();


    if (!keyword) return alerts;


    return alerts.filter((alert) => {
      return (
        alert.patientName?.toLowerCase().includes(keyword) ||
        alert.title?.toLowerCase().includes(keyword) ||
        alert.message?.toLowerCase().includes(keyword) ||
        alert.level?.toLowerCase().includes(keyword)
      );
    });
  }, [alerts, searchText]);


  const getAlertBoxClass = (level: string) => {
    if (level === "critical") {
      return "border-red-200 bg-red-50";
    }


    if (level === "warning") {
      return "border-amber-200 bg-amber-50";
    }


    return "border-blue-200 bg-blue-50";
  };


  const getAlertBadgeClass = (level: string) => {
    if (level === "critical") {
      return "bg-red-100 text-red-700 border-red-200";
    }


    if (level === "warning") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }


    return "bg-blue-100 text-blue-700 border-blue-200";
  };


  const formatDateTime = (value: any, dateOnly = false) => {
    if (!value) return "N/A";

    const text = String(value);
    const date = new Date(
      dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? `${text}T12:00:00`
        : text
    );

    if (Number.isNaN(date.getTime())) return "N/A";

    return dateOnly ? date.toLocaleDateString() : date.toLocaleString();
  };


  const goToPatient = (patientId: string) => {
    navigate(`/admin/patient/${patientId}`, {
      state: { from: "/admin/alerts" },
    });
  };


  const sendAlertEmail = (alert: any) => {
    const subject = encodeURIComponent(`MyHFGuard Alert - ${alert.patientName}`);
    const body = encodeURIComponent(
      [
        `Patient: ${alert.patientName}`,
        `Alert Level: ${String(alert.level || "").toUpperCase()}`,
        `Alert: ${alert.title}`,
        `Details: ${alert.message}`,
        `${alert.timeLabel || "Latest record"}: ${formatDateTime(
          alert.createdAt,
          alert.dateOnly
        )}`,
      ].join("\n")
    );


    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success("Email draft opened");
  };


  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Alert Center"
              subtitle="Review alerts calculated from each patient’s latest records within the last 7 days."
              onRefresh={fetchAlerts}
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              showExport={false}
            />


            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}


            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Active Alerts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Only the latest patient records are used, sorted from newest to oldest.
                  </p>
                </div>


                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search alert..."
                      className="w-full bg-white text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:w-64"
                    />
                  </div>


                  <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {filteredAlerts.length} alert(s)
                  </div>
                </div>
              </div>
            </div>


            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-medium">Loading alerts...</span>
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <p className="font-medium text-slate-700">
                  No active alerts found.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Warning and critical alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.alertKey}
                    className={`rounded-2xl border p-4 text-slate-900 shadow-sm ${getAlertBoxClass(
                      alert.level
                    )}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="shrink-0 pt-1">
                          {alert.level === "critical" ? (
                            <TriangleAlert className="h-5 w-5 text-red-600" />
                          ) : (
                            <CircleAlert className="h-5 w-5 text-amber-600" />
                          )}
                        </div>


                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getAlertBadgeClass(
                                alert.level
                              )}`}
                            >
                              {alert.level}
                            </span>


                            <p className="text-sm text-slate-500">
                              {alert.timeLabel || "Latest record"}: {formatDateTime(
                                alert.createdAt,
                                alert.dateOnly
                              )}
                            </p>
                          </div>


                          <h3 className="mt-2 break-words text-lg font-bold text-slate-900">
                            {alert.title} — {alert.patientName}
                          </h3>


                          <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">
                            {alert.message}
                          </p>
                        </div>
                      </div>


                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => goToPatient(alert.patientId)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          View Patient
                        </button>


                        <button
                          type="button"
                          onClick={() => sendAlertEmail(alert)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
