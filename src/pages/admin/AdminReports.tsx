import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Activity,
  Droplets,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Loader2,
  Scale,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";


import { serverUrl } from "@/lib/api";
import { buildAlerts, pickWorstStatus } from "@/lib/adminAlertUtils";


import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";


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


      const patientsRes = await fetch(`${API}/api/admin/patients`);
      if (!patientsRes.ok) throw new Error("Failed to fetch patients");


      const patientsData = await patientsRes.json();


      const patientRows = [...(patientsData.patients || [])].sort(
        (a: any, b: any) => {
          return getDateTime(b.created_at) - getDateTime(a.created_at);
        }
      );


      const detailed = await Promise.all(
        patientRows.map(async (patient: any) => {
          const patientId = patient.patient_id;


          const [patientInfoRes, summaryRes, vitalsRes, weeklyStatusRes] =
            await Promise.all([
              fetch(`${API}/admin/patient-info?patientId=${patientId}`).then(
                (r) => (r.ok ? r.json() : null)
              ),


              fetch(`${API}/patient/summary?patientId=${patientId}`).then((r) =>
                r.ok ? r.json() : null
              ),


              fetch(
                `${API}/patient/vitals?patientId=${patientId}&period=monthly&tzOffsetMin=480`
              ).then((r) => (r.ok ? r.json() : null)),


              fetch(`${API}/patient/weekly-status?patientId=${patientId}`).then(
                (r) => (r.ok ? r.json() : null)
              ),
            ]);


          const alerts = buildAlerts({
            patientId,
            summaryData: summaryRes,
            vitalsData: vitalsRes,
            weeklyStatus: weeklyStatusRes,
            demoMode: false,
          });


          return {
            patientId,
            patientInfo: patientInfoRes,
            summaryData: summaryRes,
            vitalsData: vitalsRes,
            weeklyStatus: weeklyStatusRes,
            alerts,
            status: pickWorstStatus(alerts),
            createdAt:
              patient.created_at ||
              patientInfoRes?.patient?.created_at ||
              patientInfoRes?.patient?.createdAt ||
              "",
          };
        })
      );


      detailed.sort((a: any, b: any) => {
        return getDateTime(b.createdAt) - getDateTime(a.createdAt);
      });


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
      const vitals = item.vitalsData?.vitals || {};


      const latestSpo2 =
        vitals.spo2?.length > 0
          ? vitals.spo2[vitals.spo2.length - 1]?.avg
          : "";


      const latestWeight =
        vitals.weight?.length > 0
          ? vitals.weight[vitals.weight.length - 1]?.value
          : "";


      return {
        "Patient ID": item.patientId,
        Name:
          `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
          item.patientId,
        "Heart Rate": s.heartRate ?? "",
        "BP Systolic": s.bpSystolic ?? "",
        "BP Diastolic": s.bpDiastolic ?? "",
        "Steps Today": s.stepsToday ?? "",
        "Latest SpO2": latestSpo2 ?? "",
        "Latest Weight": latestWeight ?? "",
        Status: item.status,
        "Primary Alert": item.alerts?.[0]?.title || "",
        "Alert Detail": item.alerts?.[0]?.message || "",
      };
    });


    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Admin Reports");
    XLSX.writeFile(wb, "admin_reports_real_data.xlsx");
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
      const vitals = item.vitalsData?.vitals || {};
      const s = item.summaryData?.summary || {};


      const latestSpo2 =
        vitals.spo2?.length > 0
          ? Number(vitals.spo2[vitals.spo2.length - 1]?.avg)
          : null;


      const latestWeight =
        vitals.weight?.length > 0
          ? Number(vitals.weight[vitals.weight.length - 1]?.value)
          : null;


      const hr = Number(s.heartRate);


      if (!Number.isNaN(latestSpo2) && latestSpo2 && latestSpo2 > 0) {
        spo2Total += latestSpo2;
        spo2Count++;
      }


      if (!Number.isNaN(hr) && hr > 0) {
        hrTotal += hr;
        hrCount++;
      }


      if (!Number.isNaN(latestWeight) && latestWeight && latestWeight > 0) {
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


  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Analytics & Reports"
              subtitle="Real patient health data, alerts, vitals and exportable reports."
              onRefresh={fetchReports}
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              showExport={false}
            />


            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Report Export
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Export PDF and Excel reports from the latest patient records.
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
                    <span className="font-medium">
                      Loading real report data...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <ReportCard
                      icon={<Droplets />}
                      title="Average SpO₂"
                      value={`${reportData.avgSpo2}%`}
                    />


                    <ReportCard
                      icon={<HeartPulse />}
                      title="Average Heart Rate"
                      value={`${reportData.avgHeartRate} bpm`}
                    />


                    <ReportCard
                      icon={<Scale />}
                      title="Average Weight"
                      value={`${reportData.avgWeight} kg`}
                    />


                    <ReportCard
                      icon={<Activity />}
                      title="Total Patients"
                      value={reportData.totalPatients}
                    />
                  </div>


                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                      <h2 className="mb-4 font-bold text-slate-900">
                        Patient Status Overview
                      </h2>


                      <div className="space-y-4">
                        <Bar
                          label="Stable Patients"
                          value={reportData.stable}
                          total={reportData.totalPatients}
                        />


                        <Bar
                          label="Warning Patients"
                          value={reportData.warning}
                          total={reportData.totalPatients}
                        />


                        <Bar
                          label="Critical Patients"
                          value={reportData.critical}
                          total={reportData.totalPatients}
                        />
                      </div>
                    </div>


                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                      <h2 className="mb-4 font-bold text-slate-900">
                        Weekly SpO₂ Trend
                      </h2>


                      <div className="grid h-56 grid-cols-7 items-end gap-3 border-b border-slate-200 px-2">
                        {getWeeklySpo2(summary).map((value, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className="w-8 rounded-t-lg bg-blue-500"
                              style={{
                                height: `${value ? value * 1.8 : 8}px`,
                              }}
                            />
                            <span className="text-xs text-slate-500">
                              D{index + 1}
                            </span>
                          </div>
                        ))}
                      </div>


                      <p className="mt-4 text-sm text-slate-500">
                        This chart is calculated from real weekly SpO₂ values
                        where available.
                      </p>
                    </div>
                  </div>


                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                    <h2 className="mb-4 font-bold text-slate-900">
                      Patient Report Table
                    </h2>


                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-[900px] w-full text-sm text-slate-900">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">
                              Patient ID
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              SpO₂
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Heart Rate
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              BP
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Steps
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Weight
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>


                        <tbody className="bg-white text-slate-800">
                          {summary.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-slate-500"
                              >
                                No report data found.
                              </td>
                            </tr>
                          ) : (
                            summary.map((item, index) => {
                              const patient = item.patientInfo?.patient || {};
                              const s = item.summaryData?.summary || {};
                              const vitals = item.vitalsData?.vitals || {};


                              const latestSpo2 =
                                vitals.spo2?.length > 0
                                  ? vitals.spo2[vitals.spo2.length - 1]?.avg
                                  : "-";


                              const latestWeight =
                                vitals.weight?.length > 0
                                  ? vitals.weight[vitals.weight.length - 1]
                                      ?.value
                                  : "-";


                              return (
                                <tr
                                  key={item.patientId || index}
                                  className="border-b border-slate-200 text-slate-800 hover:bg-slate-50"
                                >
                                  <td className="break-all px-4 py-3 text-slate-700">
                                    {item.patientId}
                                  </td>


                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    {`${patient.first_name || ""} ${
                                      patient.last_name || ""
                                    }`.trim() || "-"}
                                  </td>


                                  <td className="px-4 py-3 text-slate-700">
                                    {latestSpo2 === "-"
                                      ? "-"
                                      : `${latestSpo2}%`}
                                  </td>


                                  <td className="px-4 py-3 text-slate-700">
                                    {s.heartRate ? `${s.heartRate} bpm` : "-"}
                                  </td>


                                  <td className="px-4 py-3 text-slate-700">
                                    {s.bpSystolic && s.bpDiastolic
                                      ? `${s.bpSystolic}/${s.bpDiastolic}`
                                      : "-"}
                                  </td>


                                  <td className="px-4 py-3 text-slate-700">
                                    {s.stepsToday ?? "-"}
                                  </td>


                                  <td className="px-4 py-3 text-slate-700">
                                    {latestWeight === "-"
                                      ? "-"
                                      : `${latestWeight} kg`}
                                  </td>


                                  <td className="px-4 py-3">
                                    <StatusBadge status={item.status} />
                                  </td>
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


        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}


function ReportCard({ icon, title, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>


      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
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
        <div
          className="h-3 rounded-full bg-blue-500"
          style={{ width: `${percent}%` }}
        />
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
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {status || "stable"}
    </span>
  );
}


function getWeeklySpo2(summary: any[]) {
  const dailyTotals = Array(7).fill(0);
  const dailyCounts = Array(7).fill(0);


  summary.forEach((item) => {
    const spo2List = item.vitalsData?.vitals?.spo2 || [];


    spo2List.slice(-7).forEach((row: any, index: number) => {
      const value = Number(row.avg);


      if (!Number.isNaN(value) && value > 0) {
        dailyTotals[index] += value;
        dailyCounts[index]++;
      }
    });
  });


  return dailyTotals.map((total, index) =>
    dailyCounts[index] ? Math.round(total / dailyCounts[index]) : 0
  );
}

