import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

import { getPatients, serverUrl } from "@/lib/api";
import { buildAlerts, pickWorstStatus } from "@/lib/adminAlertUtils";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminRecentAlerts from "@/components/admin/AdminRecentAlerts";
import AdminSummaryPanels from "@/components/admin/AdminSummaryPanels";
import AdminActivityFeed from "@/components/admin/AdminActivityFeed";
import AdminKeyMetricsPanel from "@/components/admin/AdminKeyMetricsPanel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const exportRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [showExportBox, setShowExportBox] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API = serverUrl();
  const DEMO_MODE = false;

  const getDateTime = (value) => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const localDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getEmptyVitals = () => ({
    vitals: {
      hr: [],
      spo2: [],
      steps: [],
      bp: [],
      weight: [],
    },
  });

  const hasVitalsData = (data) => {
    const vitals = data?.vitals || {};

    return (
      (Array.isArray(vitals.weight) && vitals.weight.length > 0) ||
      (Array.isArray(vitals.bp) && vitals.bp.length > 0) ||
      (Array.isArray(vitals.hr) && vitals.hr.length > 0) ||
      (Array.isArray(vitals.spo2) && vitals.spo2.length > 0) ||
      (Array.isArray(vitals.steps) && vitals.steps.length > 0)
    );
  };

  const latestByTime = (rows = [], getter = (row) => row?.time) => {
    return (
      [...rows]
        .filter(Boolean)
        .sort((a, b) => getDateTime(getter(b)) - getDateTime(getter(a)))[0] ||
      null
    );
  };

  const buildLatestSevenDaySummary = (rawSummary, vitalsData, todayKey) => {
    const vitals = vitalsData?.vitals || {};
    const latestHr = latestByTime(vitals.hr || []);
    const latestSpo2 = latestByTime(vitals.spo2 || []);
    const latestBp = latestByTime(vitals.bp || []);
    const latestWeight = latestByTime(vitals.weight || []);
    const latestSteps = latestByTime(vitals.steps || []);
    const todaySteps = (vitals.steps || []).find(
      (row) => String(row?.time || "").slice(0, 10) === todayKey
    );

    const observationTimes = [
      latestHr?.time,
      latestSpo2?.time,
      latestBp?.time,
      latestWeight?.time,
      latestSteps?.time,
    ].filter(Boolean);

    const lastObservation =
      observationTimes.sort(
        (a, b) => getDateTime(b) - getDateTime(a)
      )[0] || null;

    return {
      summary: {
        ...(rawSummary?.summary || {}),
        heartRate: latestHr ? Number(latestHr.avg) : null,
        spo2: latestSpo2 ? Number(latestSpo2.avg) : null,
        bpSystolic: latestBp ? Number(latestBp.systolic) : null,
        bpDiastolic: latestBp ? Number(latestBp.diastolic) : null,
        bpPulse: latestBp ? Number(latestBp.pulse) : null,
        weightKg: latestWeight ? Number(latestWeight.value) : null,
        stepsToday: todaySteps ? Number(todaySteps.count) : null,
        latestSteps: latestSteps ? Number(latestSteps.count) : null,
        lastSyncTs: lastObservation,
      },
    };
  };

  async function fetchLatestSevenDayVitals(realPatientId) {
    const today = localDateKey(new Date());
    const url = `${API}/patient/vitals?patientId=${encodeURIComponent(
      realPatientId
    )}&period=weekly&date=${today}&tzOffsetMin=480`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.error(
          "[AdminDashboard] latest 7-day vitals fetch failed",
          res.status,
          res.statusText
        );
        return getEmptyVitals();
      }

      const data = await res.json();
      return hasVitalsData(data) ? data : getEmptyVitals();
    } catch (error) {
      console.error(
        "[AdminDashboard] latest 7-day vitals fetch failed",
        error
      );
      return getEmptyVitals();
    }
  }

  async function fetchAll() {
    try {
      setLoading(true);
      setError("");

      // getPatients() automatically sends the current Supabase admin token
      // as Authorization: Bearer <access_token>.
      const patientsJson = await getPatients();

      const patientRows = [...(patientsJson.patients || [])].sort((a, b) => {
        return getDateTime(b.created_at) - getDateTime(a.created_at);
      });

      setUsers(patientRows);

      const rangeEndDate = new Date();
      const rangeStartDate = new Date(rangeEndDate);
      rangeStartDate.setDate(rangeStartDate.getDate() - 6);
      const rangeStart = localDateKey(rangeStartDate);
      const rangeEnd = localDateKey(rangeEndDate);

      const detailed = await Promise.all(
        patientRows.map(async (patient, index) => {
          const realPatientId = patient.patient_id;

          const demoPatientId =
            DEMO_MODE && index === 0
              ? "demo-critical"
              : DEMO_MODE && index === 1
              ? "demo-warning"
              : realPatientId;

          const [
            patientInfoRes,
            summaryRes,
            vitalsRes,
            weeklyStatusRes,
            waterSaltRes,
          ] = await Promise.all([
            fetch(`${API}/admin/patient-info?patientId=${realPatientId}`).then(
              (r) => (r.ok ? r.json() : null)
            ),

            fetch(`${API}/patient/summary?patientId=${realPatientId}`).then(
              (r) => (r.ok ? r.json() : null)
            ),

            fetchLatestSevenDayVitals(realPatientId),

            fetch(
              `${API}/patient/weekly-status?patientId=${realPatientId}&endDate=${rangeEnd}`
            ).then((r) => (r.ok ? r.json() : null)),

            supabase
              .from("water_salt_logs")
              .select("*")
              .eq("patient_id", realPatientId)
              .gte("entry_date", rangeStart)
              .lte("entry_date", rangeEnd)
              .order("entry_date", { ascending: false })
              .limit(1)
              .then(({ data, error }) =>
                error ? null : data?.[0] || null
              ),
          ]);

          const sevenDaySummary = buildLatestSevenDaySummary(
            summaryRes,
            vitalsRes,
            rangeEnd
          );

          const alerts = buildAlerts({
            patientId: demoPatientId,
            summaryData: sevenDaySummary,
            vitalsData: vitalsRes,
            weeklyStatus: weeklyStatusRes,
            demoMode: DEMO_MODE,
          });

          return {
            patientId: realPatientId,
            patientInfo: patientInfoRes,
            summaryData: sevenDaySummary,
            vitalsData: vitalsRes || getEmptyVitals(),
            weeklyStatus: weeklyStatusRes,
            waterSaltLog: waterSaltRes,
            alerts,
            status: pickWorstStatus(alerts),
            createdAt:
              sevenDaySummary?.summary?.lastSyncTs ||
              patient.created_at ||
              patientInfoRes?.patient?.created_at ||
              patientInfoRes?.patient?.createdAt ||
              "",
          };
        })
      );

      detailed.sort((a, b) => {
        return getDateTime(b.createdAt) - getDateTime(a.createdAt);
      });

      setSummary(detailed);
    } catch (e) {
      console.error("[AdminDashboard] fetchAll error", e);

      const message = e instanceof Error ? e.message : String(e);
      setError(message);

      if (message.toLowerCase().includes("session has expired")) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();

    const timer = setInterval(() => {
      fetchAll();
    }, 600000);

    return () => clearInterval(timer);
  }, [API]);

  const dashboardData = useMemo(() => {
    const totalPatients = users.length;
    const activePatients = summary.length;

    let avgSpo2 = 0;
    let avgHr = 0;
    let avgSteps = 0;

    let spo2Count = 0;
    let hrCount = 0;
    let stepsCount = 0;

    let stable = 0;
    let warning = 0;
    let critical = 0;

    const alerts = [];

    summary.forEach((item) => {
      const vitals = item.vitalsData?.vitals || {};
      const spo2Values = (vitals.spo2 || [])
        .map((row) => Number(row?.avg))
        .filter((value) => Number.isFinite(value) && value > 0);
      const hrValues = (vitals.hr || [])
        .map((row) => Number(row?.avg))
        .filter((value) => Number.isFinite(value) && value > 0);
      const stepValues = (vitals.steps || [])
        .map((row) => Number(row?.count))
        .filter((value) => Number.isFinite(value) && value >= 0);

      spo2Values.forEach((value) => {
        avgSpo2 += value;
        spo2Count++;
      });

      hrValues.forEach((value) => {
        avgHr += value;
        hrCount++;
      });

      stepValues.forEach((value) => {
        avgSteps += value;
        stepsCount++;
      });

      if (item.status === "critical") critical++;
      else if (item.status === "warning") warning++;
      else stable++;

      const primaryAlert =
        item.alerts.find((a) => a.level !== "stable") || item.alerts[0];

      if (
        primaryAlert &&
        !acknowledgedAlerts.includes(`${item.patientId}-${primaryAlert.id}`)
      ) {
        alerts.push({
          id: `${item.patientId}-${primaryAlert.id}`,
          level: primaryAlert.level,
          title: primaryAlert.title,
          patientId: item.patientId,
          message: primaryAlert.message,
          createdAt: item.createdAt,
        });
      }
    });

    alerts.sort(
      (a, b) => getDateTime(b.createdAt) - getDateTime(a.createdAt)
    );

    return {
      totalPatients,
      activePatients,
      newThisMonth: users.length,
      avgSpo2: spo2Count ? Math.round(avgSpo2 / spo2Count) : "-",
      avgHr: hrCount ? Math.round(avgHr / hrCount) : "-",
      avgSteps: stepsCount ? Math.round(avgSteps / stepsCount) : "-",
      stable,
      warning,
      critical,
      alerts,
    };
  }, [users, summary, acknowledgedAlerts]);

  const exportExcel = () => {
    const rows = summary.map((item) => {
      const patient = item.patientInfo?.patient || {};
      const s = item.summaryData?.summary || {};

      const latestSpo2 =
        item.vitalsData?.vitals?.spo2 &&
        item.vitalsData.vitals.spo2.length > 0
          ? item.vitalsData.vitals.spo2[
              item.vitalsData.vitals.spo2.length - 1
            ]?.avg
          : "";

      const latestWeight =
        item.vitalsData?.vitals?.weight &&
        item.vitalsData.vitals.weight.length > 0
          ? item.vitalsData.vitals.weight[
              item.vitalsData.vitals.weight.length - 1
            ]?.value
          : "";

      return {
        "Patient ID": item.patientId,
        "First Name": patient.first_name || "",
        "Last Name": patient.last_name || "",
        "Date of Birth": patient.dob || "",
        "Heart Rate": s.heartRate ?? "",
        "BP Systolic": s.bpSystolic ?? "",
        "BP Diastolic": s.bpDiastolic ?? "",
        Pulse: s.bpPulse ?? "",
        "Steps Today": s.stepsToday ?? "",
        "Distance Today": s.distanceToday ?? "",
        "Latest SpO2": latestSpo2 ?? "",
        "Latest Weight": latestWeight ?? "",
        Status: item.status,
        "Primary Alert": item.alerts?.[0]?.title || "",
        "Alert Detail": item.alerts?.[0]?.message || "",
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Admin Dashboard");
    XLSX.writeFile(wb, "admin_dashboard_report.xlsx");
    toast.success("Excel file downloaded");
  };

  const exportPDF = async () => {
    try {
      if (!exportRef.current) return;

      const canvas = await html2canvas(exportRef.current, {
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
      let position = 40;

      pdf.setFontSize(16);
      pdf.text("MyHFGuard Admin Dashboard Report", 20, 25);
      pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 40;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 40;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("admin_dashboard_report.pdf");
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    }
  };

  const acknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts((prev) => [...prev, alertId]);
    toast.success("Alert acknowledged");
  };

  const sendAlertEmail = (alert) => {
    const row = summary.find((x) => x.patientId === alert.patientId);
    const patient = row?.patientInfo?.patient || {};

    const patientName =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
      "Patient";

    const subject = encodeURIComponent(`MyHFGuard Alert - ${patientName}`);
    const body = encodeURIComponent(
      [
        `Patient: ${patientName}`,
        `Alert Level: ${alert.level.toUpperCase()}`,
        `Alert: ${alert.title}`,
        `Details: ${alert.message}`,
      ].join("\n")
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success(`Email draft opened for ${patientName}`);
  };

  const goToPatient = (patientId) => {
    navigate(`/admin/patient/${patientId}`, {
      state: { from: "/admin/dashboard" },
    });
  };

  const alertsToShow = dashboardData.alerts.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <div ref={exportRef} className="min-w-0 flex-1">
          <main className="min-w-0 p-4 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <AdminTopBar
                title="Dashboard"
                subtitle="Monitor patient status and health data from the latest 7 days."
                showExportBox={showExportBox}
                setShowExportBox={setShowExportBox}
                exportPDF={exportPDF}
                exportExcel={exportExcel}
                onRefresh={fetchAll}
                onMenuClick={() => setSidebarOpen((prev) => !prev)}
              />

              {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
                  <Loader2 className="animate-spin" size={18} />
                  Loading dashboard...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <AdminRecentAlerts
                      alertsToShow={alertsToShow}
                      acknowledgeAlert={acknowledgeAlert}
                      goToPatient={goToPatient}
                      sendAlertEmail={sendAlertEmail}
                      summary={summary}
                    />

                    <AdminSummaryPanels dashboardData={dashboardData} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <AdminKeyMetricsPanel
                      dashboardData={dashboardData}
                      summary={summary}
                    />

                    <AdminActivityFeed summary={summary} />
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}