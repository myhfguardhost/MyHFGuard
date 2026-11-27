import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminPatientAccount, deletePatientPermanently, getNextPatientUserId, getPatients, PatientProfile } from "@/lib/api";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Lock, LockOpen, Plus, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { patientDisplayName } from "@/lib/patientName";
import { cn } from "@/lib/utils";
import {
  checkField,
  EMPTY_PROFILE_VALUES,
  FieldKey,
  FormValues,
  ProfileFieldsGrid,
  toProfileUpdate,
} from "@/components/admin/PatientProfileEditor";

function getDateTime(value: any) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

type SortColumn = "patient" | "userId" | "profile" | "joined";
type SortState = { column: SortColumn; direction: "asc" | "desc" };

const ALL_PROFILE_FIELDS = Object.keys(EMPTY_PROFILE_VALUES) as FieldKey[];

function choiceClass(selected: boolean) {
  return selected
    ? "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
}

export default function PatientList() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [nextUserId, setNextUserId] = useState("");
  const [loadingNextUserId, setLoadingNextUserId] = useState(false);
  const [passwordMode, setPasswordMode] = useState<"default" | "custom">("default");
  const [newPassword, setNewPassword] = useState("");
  const [fillProfile, setFillProfile] = useState(false);
  const [profileValues, setProfileValues] = useState<FormValues>(EMPTY_PROFILE_VALUES);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [creating, setCreating] = useState(false);
  const [unlockedPatients, setUnlockedPatients] = useState<Set<string>>(new Set());
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [userIdSearch, setUserIdSearch] = useState("");
  // Starts as "latest joined first", like before.
  const [sort, setSort] = useState<SortState>({ column: "joined", direction: "desc" });

  const navigate = useNavigate();

  const visiblePatients = useMemo(() => {
    const query = userIdSearch.trim().toLowerCase();
    const filtered = patients.filter((patient: any) =>
      String(patient.assigned_user_id || "").toLowerCase().includes(query)
    );

    const nameOf = (patient: any) =>
      patientDisplayName([{ ...patient, full_name: patient.full_name || patient.profile_name }], "");
    const text = (first: string, second: string) =>
      first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });

    return [...filtered].sort((a: any, b: any) => {
      let comparison = 0;
      if (sort.column === "patient") comparison = text(nameOf(a), nameOf(b));
      else if (sort.column === "userId") comparison = text(String(a.assigned_user_id || ""), String(b.assigned_user_id || ""));
      else if (sort.column === "profile") comparison = Number(Boolean(a.profile_completed)) - Number(Boolean(b.profile_completed));
      else comparison = getDateTime(a.created_at) - getDateTime(b.created_at);
      // Same value: keep a stable order by User ID.
      if (comparison === 0) comparison = text(String(a.assigned_user_id || ""), String(b.assigned_user_id || ""));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [patients, userIdSearch, sort]);

  useEffect(() => {
    fetchPatients();
  }, []);


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

  const resetCreateForm = () => {
    setPasswordMode("default");
    setNewPassword("");
    setFillProfile(false);
    setProfileValues(EMPTY_PROFILE_VALUES);
    setProfileErrors({});
  };

  // Show the User ID the server will give, e.g. P011 after P010.
  const openCreateDialog = async (open: boolean) => {
    if (creating) return;
    setCreateOpen(open);
    if (!open) return;
    resetCreateForm();
    setNextUserId("");
    try {
      setLoadingNextUserId(true);
      setNextUserId(await getNextPatientUserId());
    } catch (error: any) {
      toast.error(error?.message || "Unable to get the next User ID.");
    } finally {
      setLoadingNextUserId(false);
    }
  };

  const setProfileField = (key: FieldKey, value: string) => {
    setProfileValues((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
  };

  const createPatient = async () => {
    if (passwordMode === "custom" && newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (fillProfile) {
      const problems: Partial<Record<FieldKey, string>> = {};
      for (const key of ALL_PROFILE_FIELDS) {
        const problem = checkField(key, profileValues[key]);
        if (problem) problems[key] = problem;
      }
      if (Object.keys(problems).length) {
        setProfileErrors(problems);
        toast.error(Object.values(problems)[0] as string);
        return;
      }
    }

    try {
      setCreating(true);

      // No User ID is sent: the server gives the next free one, so two admins
      // adding patients at the same time can never get the same ID.
      const result = await createAdminPatientAccount({
        ...(passwordMode === "default" ? { useDefaultPassword: true } : { password: newPassword }),
        ...(fillProfile ? { profile: toProfileUpdate(profileValues, ALL_PROFILE_FIELDS) } : {}),
      });

      const createdUserId = String(result.patient?.assigned_user_id || nextUserId).toUpperCase();
      toast.success(
        passwordMode === "default"
          ? `Patient account ${createdUserId} created with the default password.`
          : `Patient account ${createdUserId} created.`
      );
      setCreateOpen(false);
      resetCreateForm();
      await fetchPatients();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create patient account.");
    } finally {
      setCreating(false);
    }
  };

  const toggleDeleteLock = (patientId: string) => {
    setUnlockedPatients((current) => {
      const next = new Set(current);
      next.has(patientId) ? next.delete(patientId) : next.add(patientId);
      return next;
    });
  };

  const permanentlyDeletePatient = async (patient: PatientProfile) => {
    if (!unlockedPatients.has(patient.patient_id)) return;
    if (window.prompt("Type DELETE to permanently delete this patient and all records.") !== "DELETE") return;
    try {
      setDeletingPatientId(patient.patient_id);
      await deletePatientPermanently(patient.patient_id);
      setPatients((current) => current.filter((row) => row.patient_id !== patient.patient_id));
      toast.success("Patient permanently deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete patient.");
    } finally {
      setDeletingPatientId(null);
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
                        Click a column title to sort.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {userIdSearch.trim()
                          ? `${visiblePatients.length} of ${patients.length} patients`
                          : `${patients.length} patients`}
                      </div>

                      <Dialog open={createOpen} onOpenChange={openCreateDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 text-white hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Patient
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-slate-900 sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add Patient</DialogTitle>
                            <DialogDescription>
                              Create a login for a new patient. You can also fill in their profile for them.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-5 py-2">
                            <div className="space-y-1.5">
                              <Label>User ID</Label>
                              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-900">
                                {loadingNextUserId ? (
                                  <span className="flex items-center gap-2 font-sans text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Getting next User ID...
                                  </span>
                                ) : (
                                  nextUserId || "Given when the account is created"
                                )}
                              </div>
                              <p className="text-xs text-slate-500">Given automatically: the next number after the latest patient.</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Password</Label>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <button type="button" onClick={() => setPasswordMode("default")} className={cn("rounded-lg border px-3 py-2 text-left text-sm", choiceClass(passwordMode === "default"))}>
                                  <span className="block font-semibold">Use default password</span>
                                  <span className="block text-xs opacity-80">The same password that Reset Password uses.</span>
                                </button>
                                <button type="button" onClick={() => setPasswordMode("custom")} className={cn("rounded-lg border px-3 py-2 text-left text-sm", choiceClass(passwordMode === "custom"))}>
                                  <span className="block font-semibold">Set a password</span>
                                  <span className="block text-xs opacity-80">Type a temporary password.</span>
                                </button>
                              </div>
                              {passwordMode === "custom" && (
                                <PasswordInput
                                  id="new-password"
                                  value={newPassword}
                                  onChange={(event) => setNewPassword(event.target.value)}
                                  placeholder="At least 8 characters"
                                  autoComplete="new-password"
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Profile</Label>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <button type="button" onClick={() => setFillProfile(false)} className={cn("rounded-lg border px-3 py-2 text-left text-sm", choiceClass(!fillProfile))}>
                                  <span className="block font-semibold">Only create account</span>
                                  <span className="block text-xs opacity-80">The patient fills in the profile after the first login.</span>
                                </button>
                                <button type="button" onClick={() => setFillProfile(true)} className={cn("rounded-lg border px-3 py-2 text-left text-sm", choiceClass(fillProfile))}>
                                  <span className="block font-semibold">Fill in profile now</span>
                                  <span className="block text-xs opacity-80">Saved and locked; the patient skips this step.</span>
                                </button>
                              </div>
                              {fillProfile && (
                                <div className="rounded-lg border border-slate-200 p-3">
                                  <ProfileFieldsGrid values={profileValues} errors={profileErrors} onChange={setProfileField} idPrefix="new-profile" />
                                  <p className="mt-3 text-xs text-slate-500">Age and BMI are worked out automatically.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => openCreateDialog(false)}
                              disabled={creating}
                              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              Cancel
                            </Button>
                            <Button onClick={createPatient} disabled={creating || loadingNextUserId} className="bg-blue-600 text-white hover:bg-blue-700">
                              {creating ? "Creating..." : "Create Account"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={userIdSearch}
                        onChange={(event) => setUserIdSearch(event.target.value)}
                        placeholder="Search User ID"
                        aria-label="Search patients by User ID"
                        className="border-slate-300 bg-white pl-9 text-slate-900"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100 hover:bg-slate-100">
                          <SortableHead label="Patient" column="patient" sort={sort} onSort={setSort} className="min-w-[220px]" />
                          <SortableHead label="User ID" column="userId" sort={sort} onSort={setSort} className="min-w-[160px]" />
                          <SortableHead label="Profile" column="profile" sort={sort} onSort={setSort} className="min-w-[150px]" />
                          <SortableHead label="Joined" column="joined" sort={sort} onSort={setSort} className="min-w-[160px]" />
                          <TableHead className="min-w-[260px] text-right text-slate-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {visiblePatients.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-10 text-center text-slate-500"
                            >
                              {userIdSearch.trim()
                                ? "No matching User ID found."
                                : "No patients found."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          visiblePatients.map((patient: any) => {
                            const patientName = patientDisplayName(
                              [{ ...patient, full_name: patient.full_name || patient.profile_name }],
                              "Profile Pending"
                            );

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
                                  <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPatientDetails(patient.patient_id)}
                                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                  >
                                    View Details
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => toggleDeleteLock(patient.patient_id)} aria-label={unlockedPatients.has(patient.patient_id) ? "Lock deletion" : "Unlock deletion"}>
                                    {unlockedPatients.has(patient.patient_id) ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                  </Button>
                                  <Button variant="destructive" size="sm" disabled={!unlockedPatients.has(patient.patient_id) || deletingPatientId === patient.patient_id} onClick={() => permanentlyDeletePatient(patient)}>
                                    {deletingPatientId === patient.patient_id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}Delete
                                  </Button>
                                  </div>
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

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: SortState;
  onSort: (next: SortState) => void;
  className?: string;
}) {
  const active = sort.column === column;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn("text-slate-700", className)}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort({ column, direction: active && sort.direction === "asc" ? "desc" : "asc" })}
        className={cn(
          "-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium hover:bg-slate-100",
          active ? "text-slate-900" : "text-slate-700"
        )}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "text-blue-600" : "text-slate-400")} />
      </button>
    </TableHead>
  );
}
