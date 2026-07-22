import { useMemo, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Stethoscope,
  Droplets,
  BookOpen,
  LifeBuoy,
  User,
  Dumbbell,
  Bot,
  Pill,
  KeyRound,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import LanguageToggle from "@/components/LanguageToggle"
import { cn } from "@/lib/utils"
import BackToDashboard from "@/components/BackToDashboard"
import { supabase } from "@/lib/supabase"
import logoImg from "@/assets/loginlogo.jpg"

const navItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/education", labelKey: "nav.education", icon: BookOpen },
  { to: "/self-check", labelKey: "nav.selfCheck", icon: Stethoscope },
  { to: "/water-salt", labelKey: "nav.waterDiet", icon: Droplets },
  { to: "/exercise", labelKey: "nav.exercise", icon: Dumbbell },
  { to: "/medication", labelKey: "nav.medication", icon: Pill },
  { to: "/ai-assistant", labelKey: "nav.aiAssistant", icon: Bot },
  { to: "/help-support", labelKey: "nav.helpSupport", icon: LifeBuoy },
]

export default function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isDashboard =
    location.pathname === "/" || location.pathname.startsWith("/dashboard")

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/change-password")) return "Change Password"
    const current = navItems.find((item) =>
      location.pathname.startsWith(item.to)
    )
    return current ? t(current.labelKey) : t("common.appName", "MyHFGuard")
  }, [location.pathname, t])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t("nav.menu", "Menu")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("nav.quickAccess", "Quick access")}
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    "hover:bg-primary/10 hover:text-primary",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto shrink-0 space-y-2 pb-4 pt-6">
        <NavLink
          to="/profile"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
              "hover:bg-primary/10 hover:text-primary",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground"
            )
          }
        >
          <User className="h-5 w-5 shrink-0" />
          <span>{t("nav.profile", "Profile")}</span>
        </NavLink>

        <NavLink
          to="/change-password"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
              "hover:bg-primary/10 hover:text-primary",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground"
            )
          }
        >
          <KeyRound className="h-5 w-5 shrink-0" />
          <span>Change Password</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{t("nav.logout", "Logout")}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[73px] items-center justify-between border-b bg-background/95 px-3 py-3 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm md:rounded-2xl md:p-2">
            <img
              src={logoImg}
              alt="HFGuard Logo"
              className="h-8 w-auto object-contain md:h-10"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary md:text-2xl">
              {pageTitle}
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {t(
                "common.welcomeToMyHFGuard",
                "Heart failure self-care management"
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <LanguageToggle />

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-accent lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setDesktopSidebarOpen((prev) => !prev)}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-accent lg:inline-flex"
          >
            {desktopSidebarOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <main
        className={cn(
          "min-w-0 overflow-x-hidden px-3 pb-6 pt-[89px] sm:px-4 md:px-6 lg:px-8",
          desktopSidebarOpen && "lg:mr-72"
        )}
      >
        <div className="mx-auto w-full max-w-7xl min-w-0">
          {!isDashboard && (
            <div className="mb-4">
              <BackToDashboard />
            </div>
          )}

          <Outlet />
        </div>
      </main>

      {desktopSidebarOpen && (
        <aside className="fixed bottom-0 right-0 top-[73px] z-30 hidden w-72 border-l bg-card lg:block">
          <div className="flex h-full w-full flex-col p-4">
            <SidebarContent />
          </div>
        </aside>
      )}

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[82vw] max-w-xs flex-col border-l bg-card p-4 shadow-2xl">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <span className="text-lg font-semibold">
                {t("nav.menu", "Menu")}
              </span>

              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent />
          </aside>
        </div>
      )}
    </div>
  )
}
