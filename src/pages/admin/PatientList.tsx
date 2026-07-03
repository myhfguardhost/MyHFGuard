import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients, PatientProfile } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";


import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";


export default function PatientList() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const navigate = useNavigate();


  useEffect(() => {
    fetchPatients();
  }, []);


  const getDateTime = (value: any) => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };


  const fetchPatients = async () => {
    try {
      setLoading(true);


      const data = await getPatients();


      const sortedPatients = [...(data.patients || [])].sort((a: any, b: any) => {
        return getDateTime(b.created_at) - getDateTime(a.created_at);
      });


      setPatients(sortedPatients);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };


  const openPatientDetails = (patientId: string) => {
    navigate(`/admin/patient/${patientId}`, {
      state: { from: "/admin/patients" },
    });
  };


  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Patient List"
              subtitle="View registered patients and open their health records."
              onRefresh={fetchPatients}
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              showExport={false}
            />


            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-medium">Loading patients...</span>
                </div>
              </div>
            ) : (
              <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Registered Patients
                      </CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Latest registered patients are shown first.
                      </p>
                    </div>


                    <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {patients.length} patients
                    </div>
                  </div>
                </CardHeader>


                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100 hover:bg-slate-100">
                          <TableHead className="min-w-[240px] text-slate-700">
                            Name
                          </TableHead>
                          <TableHead className="min-w-[160px] text-slate-700">
                            Joined
                          </TableHead>
                          <TableHead className="min-w-[140px] text-right text-slate-700">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>


                      <TableBody>
                        {patients.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-10 text-center text-slate-500"
                            >
                              No patients found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          patients.map((patient: any) => {
                            const patientName =
                              patient.full_name ||
                              patient.profile_name ||
                              `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                              patient.name ||
                              "Unknown Patient";

                            return (
                              <TableRow
                                key={patient.patient_id}
                                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                <TableCell className="font-medium">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>


                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-slate-900">
                                        {patientName}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>


                                <TableCell className="text-slate-700">
                                  {patient.created_at
                                    ? new Date(patient.created_at).toLocaleDateString()
                                    : "N/A"}
                                </TableCell>


                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPatientDetails(patient.patient_id)}
                                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
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

