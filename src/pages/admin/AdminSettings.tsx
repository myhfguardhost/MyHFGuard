import { useEffect, useState } from "react";
import {
  Bell,
  Database,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";


export default function AdminSettings() {
  const navigate = useNavigate();


  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [role] = useState("Healthcare Provider");
  const [emailAlert, setEmailAlert] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  useEffect(() => {
    const loadAdmin = async () => {
      const { data } = await supabase.auth.getUser();


      if (data?.user) {
        setAdminName(data.user.email?.split("@")[0] || "Admin");
        setEmail(data.user.email || "");
      }
    };


    loadAdmin();
  }, []);


  const saveSettings = () => {
    toast.success("Settings saved successfully");
  };


  const logout = () => {
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };


  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }


    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });


    if (error) {
      toast.error(error.message);
      return;
    }


    setNewPassword("");
    setShowPasswordBox(false);
    toast.success("Password changed successfully");
  };


  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen w-full">
        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <AdminTopBar
              title="Account Settings"
              subtitle="Manage admin profile, alerts, security and system information."
              onMenuClick={() => setSidebarOpen(true)}
              showExport={false}
              showRefresh={false}
            />


            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  <h2 className="font-bold text-slate-900">Admin Profile</h2>
                </div>


                <p className="mb-4 text-sm text-slate-500">
                  This account receives alerts and manages patient monitoring.
                </p>


                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Admin Name
                    </label>
                    <input
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />
                  </div>


                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Email Address
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Last login: {new Date().toLocaleString()}
                    </p>
                  </div>


                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Role
                    </label>
                    <input
                      value={role}
                      disabled
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600"
                    />
                  </div>
                </div>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="text-blue-600" size={20} />
                  <h2 className="font-bold text-slate-900">
                    Alert Notification
                  </h2>
                </div>


                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        Email Alert Notification
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Send email when patient is warning or critical.
                      </p>
                    </div>


                    <button
                      onClick={() => setEmailAlert(!emailAlert)}
                      className={`w-fit shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                        emailAlert
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {emailAlert ? "Enabled" : "Disabled"}
                    </button>
                  </div>


                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Alert Receiver Email
                    </label>


                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <Mail size={16} className="shrink-0 text-slate-500" />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={20} />
                  <h2 className="font-bold text-slate-900">Security</h2>
                </div>


                <button
                  onClick={() => setShowPasswordBox(!showPasswordBox)}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Lock size={16} />
                  Change Password
                </button>


                {showPasswordBox && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />


                    <button
                      onClick={changePassword}
                      className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                      Update Password
                    </button>
                  </div>
                )}


                <button
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 py-3 font-bold text-red-600 hover:bg-red-100"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </section>


              <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Database className="text-blue-600" size={20} />
                  <h2 className="font-bold text-slate-900">
                    System Information
                  </h2>
                </div>


                <div className="space-y-3">
                  <InfoRow label="System Purpose" value="Monitor patient health" />
                  <InfoRow
                    label="Data Source"
                    value="Supabase + Smartband + User Input"
                  />
                  <InfoRow label="Refresh Rate" value="Every 10 minutes" />
                  <InfoRow label="Alert Rules" value="BP, HR, SpO₂, Weight" />
                </div>
              </section>
            </div>


            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Save size={16} />
                Save Settings
              </button>
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


function InfoRow({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-words font-medium text-slate-900">{value}</span>
    </div>
  );
}