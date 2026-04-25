import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bell,
  Lock,
  LogOut,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminSettings() {
  const navigate = useNavigate()

  const [adminName, setAdminName] = useState("Admin User")
  const [email, setEmail] = useState("myhfguard.host@gmail.com")
  const [role] = useState("Healthcare Provider")
  const [emailAlert, setEmailAlert] = useState(true)
  const [language, setLanguage] = useState("English")
  const [theme, setTheme] = useState("Light")

  const saveSettings = () => {
    toast.success("Settings saved successfully")
  }

  const logout = () => {
    localStorage.removeItem("admin")
    navigate("/admin/login")
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] p-6">
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage admin profile, notification and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Admin Profile */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            <h2 className="font-bold text-slate-800">Admin Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Admin Name
              </label>
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Role
              </label>
              <input
                value={role}
                disabled
                className="w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <h2 className="font-bold text-slate-800">
              Notification Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium text-slate-700">
                  Email Alert Notification
                </p>
                <p className="text-sm text-slate-500">
                  Send email when patient status becomes warning or critical.
                </p>
              </div>

              <button
                onClick={() => setEmailAlert(!emailAlert)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  emailAlert
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {emailAlert ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Alert Receiver Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Mail size={17} className="text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* System Preferences */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="text-blue-600" size={20} />
            <h2 className="font-bold text-slate-800">
              System Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              >
                <option>English</option>
                <option>Bahasa Melayu</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              >
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={20} />
            <h2 className="font-bold text-slate-800">Security</h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => toast.info("Change password function can be added later")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 font-medium text-slate-700 hover:bg-slate-200"
            >
              <Lock size={17} />
              Change Password
            </button>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 font-medium text-red-600 hover:bg-red-100"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <Save size={17} />
          Save Settings
        </button>
      </div>
    </div>
  )
}