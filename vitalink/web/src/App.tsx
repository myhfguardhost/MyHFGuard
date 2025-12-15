import { Toaster } from "./components/ui/toaster"
import { Toaster as Sonner } from "./components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HashRouter, Routes, Route } from "react-router-dom"

/* ... other imports ... */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/vitals" element={<RequireAuth><VitalsTracker /></RequireAuth>} />
            <Route path="/education" element={<RequireAuth><Education /></RequireAuth>} />
            <Route path="/self-check" element={<RequireAuth><SelfCheck /></RequireAuth>} />
            <Route path="/schedule" element={<RequireAuth><ScheduleReminder /></RequireAuth>} />
            <Route path="/medication" element={<RequireAuth><Medication /></RequireAuth>} />
            <Route path="/ai-assistant" element={<RequireAuth><AIAssistant /></RequireAuth>} />
            <Route path="/contact" element={<RequireAuth><Contact /></RequireAuth>} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/patients" element={<RequireAdmin><PatientList /></RequireAdmin>} />
            <Route path="/admin/patient/:id" element={<RequireAdmin><PatientDetail /></RequireAdmin>} />

            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
