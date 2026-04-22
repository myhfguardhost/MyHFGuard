import { Link } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Siren,
  FileBarChart2,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-56 flex-col bg-[#1f5fa8] text-white">
      <div className="px-5 py-5 border-b border-white/15">
        <div className="text-2xl font-bold">MyHFGuard</div>
        <p className="text-sm text-blue-100 mt-1">Admin Dashboard</p>
      </div>

      <nav className="p-4 space-y-2">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 rounded-lg bg-[#23c6e8] px-4 py-3 font-medium text-white"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          to="/admin/patients"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10"
        >
          <Users size={18} />
          Patient List
        </Link>

        <button
          onClick={() =>
            document.getElementById("recent-alerts")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
        >
          <Siren size={18} />
          Alert Center
        </button>

        <button
          onClick={() =>
            document.getElementById("analytics-reports")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
        >
          <FileBarChart2 size={18} />
          Analytics & Reports
        </button>

        <button
          onClick={() => toast.info("Account Settings page not built yet")}
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
        >
          <Settings size={18} />
          Account Settings
        </button>
      </nav>
    </aside>
  )
}