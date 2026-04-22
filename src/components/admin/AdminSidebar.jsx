import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Siren,
  FileBarChart2,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminSidebar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-slate-200">
      
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-xl font-bold text-slate-900">MyHFGuard</div>
        <p className="text-sm text-slate-600 mt-1">Admin Dashboard</p>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">

        {/* Dashboard */}
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
            ${
              isActive("/admin/dashboard")
                ? "bg-cyan-100 text-cyan-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {/* Patients */}
        <Link
          to="/admin/patients"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
            ${
              isActive("/admin/patients")
                ? "bg-cyan-100 text-cyan-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
        >
          <Users size={18} />
          Patient List
        </Link>

        {/* Alerts */}
        <button
          onClick={() =>
            document.getElementById("recent-alerts")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-left"
        >
          <Siren size={18} />
          Alert Center
        </button>

        {/* Analytics */}
        <button
          onClick={() =>
            document.getElementById("analytics-reports")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-left"
        >
          <FileBarChart2 size={18} />
          Analytics & Reports
        </button>

        {/* Settings */}
        <button
          onClick={() => toast.info("Account Settings page not built yet")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-left"
        >
          <Settings size={18} />
          Account Settings
        </button>
      </nav>
    </aside>
  )
}