import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminPatientAccount, getPatients, PatientProfile } from "@/lib/api";
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
import { Loader2, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";


import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";


export default function PatientList() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);


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


  const createPatient = async () => {
    const userId = newUserId.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(userId)) {
      toast.error("User ID must be 3-30 characters using letters, numbers, dot, dash or underscore.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    try {
      setCreating(true);
      await createAdminPatientAccount({ userId, password: newPassword });
      toast.success(`Patient account ${userId} created.`);
      setCreateOpen(false);
      setNewUserId("");
      setNewPassword("");
      await fetchPatients();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create patient account.");
    } finally {
      setCreating(false);
    }
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


                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {patients.length} patients
                      </div>

                      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 text-white hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Patient
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Patient Login</DialogTitle>
                            <DialogDescription>
                              Assign a User ID and temporary password. The patient completes their profile after the first login.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label htmlFor="new-user-id">User ID</Label>
                              <Input
                                id="new-user-id"
                                value={newUserId}
                                onChange={(event) => setNewUserId(event.target.value)}
                                placeholder="patient001"
                                autoComplete="off"
                              />
                              <p className="text-xs text-slate-500">3-30 characters: letters, numbers, dot, dash or underscore.</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="new-password">Temporary Password</Label>
                              <PasswordInput
                                id="new-password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
                            <Button onClick={createPatient} disabled={creating} className="bg-blue-600 text-white hover:bg-blue-700">
                              {creating ? "Creating..." : "Create Account"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>


                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100 hover:bg-slate-100">
                          <TableHead className="min-w-[220px] text-slate-700">Patient</TableHead>
                          <TableHead className="min-w-[160px] text-slate-700">User ID</TableHead>
                          <TableHead className="min-w-[150px] text-slate-700">Profile</TableHead>
                          <TableHead className="min-w-[160px] text-slate-700">Joined</TableHead>
                          <TableHead className="min-w-[140px] text-right text-slate-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>


                      <TableBody>
                        {patients.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
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
                              patient.assigned_user_id ||
                              "Profile Pending";

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


                                <TableCell className="font-mono text-sm text-slate-700">
                                  {patient.assigned_user_id || "-"}
                                </TableCell>

                                <TableCell>
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${patient.profile_completed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {patient.profile_completed ? "Completed" : "Pending"}
                                  </span>
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

