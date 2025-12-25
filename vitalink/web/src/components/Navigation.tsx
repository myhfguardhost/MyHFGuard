import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { NavLink } from "@/components/NavLink"
import { Heart, LayoutDashboard, BookOpen, Menu, ClipboardList, CalendarDays, LogOut, Pill, Activity, Bot, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { supabase } from "@/lib/supabase"
import ThemeToggle from "@/components/ThemeToggle"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/self-check", label: "Self Check", icon: ClipboardList },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/medication", label: "Medication", icon: Pill },
  { to: "/vitals", label: "Vitals", icon: Activity },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/education", label: "Education", icon: BookOpen },
  { to: "/contact", label: "Help & Support", icon: CircleHelp },
]

export default function Navigation() {
  const navigate = useNavigate()
  const [pid, setPid] = useState<string | undefined>(
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("patientId") || undefined : undefined
  )
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    let mounted = true
    async function init() {
      if (pid) return
      const { data } = await supabase.auth.getSession()
      const id = data?.session?.user?.id || undefined
      setIsLoggedIn(!!data?.session)
      if (mounted) setPid(id)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (!pid) setPid(session?.user?.id || undefined)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [pid])
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" })
    } catch (_) { }
    navigate("/login")
  }
  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <NavLink
              to={pid ? `/?patientId=${encodeURIComponent(pid)}` : "/"}
              className="flex items-center gap-2"
              activeClassName=""
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">MyHFGuard</span>
            </NavLink>
          </div>
          <div className="hidden xl:flex items-center gap-1">
            <ThemeToggle className="mr-2" />
            {isLoggedIn && navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={(item.to === "/schedule" || item.to === "/medication") && pid ? `${item.to}?patientId=${encodeURIComponent(pid)}` : item.to}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  activeClassName="text-primary bg-primary/10 font-medium"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              )
            })}
            {isLoggedIn && (
              <Button variant="destructive" size="icon" onClick={handleLogout} aria-label="Logout" className="ml-2">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="xl:hidden flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col gap-4 mt-8">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={(item.to === "/schedule" || item.to === "/medication") && pid ? `${item.to}?patientId=${encodeURIComponent(pid)}` : item.to}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          activeClassName="text-primary bg-primary/10 font-medium"
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </NavLink>
                      )
                    })}
                    <Button variant="destructive" size="icon" onClick={handleLogout} aria-label="Logout">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
