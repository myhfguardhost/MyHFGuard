import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Siren,
  FileBarChart2,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import logo from "@/assets/loginlogo.jpg";


export default function AdminSidebar({ open = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();


  const [visible, setVisible] = useState(open);


  useEffect(() => {
    setVisible(open);
  }, [open]);


  const closeSidebar = () => {
    setVisible(false);


    if (typeof onClose === "function") {
      onClose();
    }
  };


  const handleNavClick = () => {
    // On mobile only, close sidebar after choosing menu.
    // On desktop, sidebar stays open.
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };


  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Patient List", path: "/admin/patients", icon: Users },
    { label: "Alert Center", path: "/admin/alerts", icon: Siren },
    { label: "Analytics & Reports", path: "/admin/reports", icon: FileBarChart2 },
    { label: "Account Settings", path: "/admin/settings", icon: Settings },
  ];


  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="MyHFGuard logo"
            className="h-11 w-11 rounded-xl object-cover shadow-sm"
          />


          <div>
            <div className="text-lg font-bold text-slate-900">MyHFGuard</div>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>


        {/* X button: close sidebar only */}
        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          aria-label="Close admin menu"
        >
          <X size={18} />
        </button>
      </div>


      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;


          const active =
            location.pathname === item.path ||
            (item.path === "/admin/patients" &&
              location.pathname.startsWith("/admin/patient/"));


          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>


      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );


  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden h-screen shrink-0 overflow-hidden border-l border-slate-200 bg-white text-slate-700 transition-all duration-300 lg:flex lg:flex-col ${
          visible ? "lg:w-72" : "lg:w-0 lg:border-l-0"
        }`}
      >
        <div className="flex h-full w-72 flex-col">{sidebarContent}</div>
      </aside>


      {/* Mobile overlay */}
      {visible && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          aria-label="Close admin menu overlay"
        />
      )}


      {/* Mobile sidebar */}
      <aside
        className={`fixed right-0 top-0 z-40 flex h-screen w-72 max-w-[86vw] flex-col border-l border-slate-200 bg-white text-slate-700 shadow-xl transition-transform duration-300 lg:hidden ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

