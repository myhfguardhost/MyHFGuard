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


import { serverUrl } from "@/lib/api";
import { buildAlerts } from "@/lib/adminAlertUtils";


import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";


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


      const res = await fetch(`${API}/api/admin/patients`);


      if (!res.ok) {
        throw new Error("Failed to fetch alerts");
      }


      const data = await res.json();


      const patientRows = [...(data.patients || [])].sort((a: any, b: any) => {
        return getDateTime(b.created_at) - getDateTime(a.created_at);
      });


      const allAlerts = await Promise.all(
        patientRows.map(async (patient: any) => {
          const patientId = patient.patient_id;


          const [summaryRes, vitalsRes, weeklyStatusRes] = await Promise.all([
            fetch(`${API}/patient/summary?patientId=${patientId}`).then((r) =>
              r.ok ? r.json() : null
            ),
            fetch(`${API}/patient/vitals?patientId=${patientId}&period=weekly`).then(
              (r) => (r.ok ? r.json() : null)
            ),
            fetch(`${API}/patient/weekly-status?patientId=${patientId}`).then((r) =>
              r.ok ? r.json() : null
            ),
          ]);


          const patientName =
            `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
            patient.full_name ||
            patient.name ||
            "Unknown Patient";


          const createdAt =
            patient.updated_at ||
            patient.last_sign_in_at ||
            patient.created_at ||
            new Date().toISOString();


          const patientAlerts = buildAlerts({
            patientId,
            summaryData: summaryRes,
            vitalsData: vitalsRes,
            weeklyStatus: weeklyStatusRes,
            demoMode: false,
          });


          return patientAlerts
            .filter((alert: any) => alert.level !== "stable")
            .map((alert: any) => ({
              ...alert,
              alertKey: `${patientId}-${alert.id}`,
              patientId,
              patientName,
              createdAt,
            }));
        })
      );


      const flattened = allAlerts.flat().sort((a: any, b: any) => {
        return getDateTime(b.createdAt) - getDateTime(a.createdAt);
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


  const formatDateTime = (value: any) => {
    if (!value) return "N/A";


    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";


    return date.toLocaleString();
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
        `Time: ${formatDateTime(alert.createdAt)}`,
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
              subtitle="Review latest warning and critical patient alerts."
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
                    Latest alerts are shown from newest to oldest.
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
                              {formatDateTime(alert.createdAt)}
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