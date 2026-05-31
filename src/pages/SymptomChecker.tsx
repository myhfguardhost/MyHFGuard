import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Send,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  Pill,
  Activity,
  HeartPulse,
  Droplets,
  Footprints,
  ShieldAlert,
  ChevronRight,
  Stethoscope,
  Weight,
  ClipboardList,
  Target,
} from "lucide-react"
import { serverUrl } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Markdown from "react-markdown"
import { useLanguage } from "@/contexts/LanguageContext"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type PatientSummary = {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  age?: number | null
  height?: number | null
  bmi?: number | null
  dry_weight?: number | null
  baseline_weight?: number | null
  systolic_bp?: number | null
  diastolic_bp?: number | null
  heart_rate?: number | null
  current_medication?: string | null
}

type DashboardSummary = {
  heartRate?: number | null
  bpSystolic?: number | null
  bpDiastolic?: number | null
  bpPulse?: number | null
  weightKg?: number | null
  stepsToday?: number | null
  distanceToday?: number | null
  lastSyncTs?: string | null
}

function getStatusBadge(type: "normal" | "warning" | "danger" | "neutral") {
  const styles = {
    normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  }

  const labels = {
    normal: "Normal",
    warning: "Check",
    danger: "Urgent",
    neutral: "No data",
  }

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function getBpStatus(s?: number | null, d?: number | null) {
  if (!s || !d) return "neutral"
  if (s >= 180 || d >= 120 || s < 80 || d < 50) return "danger"
  if (s >= 140 || d >= 90) return "warning"
  return "normal"
}

function getHrStatus(hr?: number | null) {
  if (!hr) return "neutral"
  if (hr < 50 || hr > 150) return "danger"
  if (hr < 60 || hr > 100) return "warning"
  return "normal"
}

function getStepsStatus(steps?: number | null) {
  if (steps == null) return "neutral"
  if (steps < 3000) return "warning"
  return "normal"
}

export default function SymptomChecker() {
  const { t } = useLanguage()

  const getText = (key: string, fallback: string) =>
    t(key) !== key ? t(key) : fallback

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const userId = data?.session?.user?.id

      if (!userId) return

      const { data: patientData } = await supabase
        .from("patients")
        .select("patient_id, first_name, last_name, dob")
        .eq("user_id", userId)
        .maybeSingle()

      const finalPatientId = patientData?.patient_id || userId
      setPatientId(finalPatientId)

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "full_name, systolic_bp, diastolic_bp, heart_rate, current_medication, height, bmi, dry_weight, baseline_weight"
        )
        .eq("user_id", userId)
        .maybeSingle()

      let age: number | null = null
      if (patientData?.dob) {
        const dob = new Date(patientData.dob)
        const today = new Date()
        age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
      }

      setPatientSummary({
        ...(profileData || {}),
        first_name: patientData?.first_name,
        last_name: patientData?.last_name,
        age,
      })

      try {
        const summaryRes = await fetch(`${serverUrl()}/patient/summary?patientId=${finalPatientId}`)
        const summaryJson = await summaryRes.json()
        setDashboardSummary(summaryJson?.summary || null)
      } catch (e) {
        console.error("[My Chat] patient summary fetch failed", e)
      }

      setMessages([
        {
          id: "1",
          role: "assistant",
          content: getText(
            "myChatWelcome",
            "Hello! I'm your MyHFGuard AI Chat Assistant. I can help answer questions based on your **symptoms, reminders, medication and health data**.\n\n**Important:** I am not a doctor and cannot diagnose conditions. If you have chest pain, severe breathing difficulty, fainting, or stroke symptoms, please seek emergency help immediately.\n\nHow can I help you today?"
          ),
          timestamp: new Date().toISOString(),
        },
      ])

      try {
        const res = await fetch(`${serverUrl()}/health`)
        if (!res.ok) throw new Error(String(res.status))
      } catch (e) {
        console.error("[My Chat] backend health failed", e)
        toast.error("Server connectivity issue")
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault()

    const textToSend = directText || input.trim()

    if (!textToSend || !patientId || loading) {
      if (!patientId) {
        toast.error(getText("userNotFound", "Unable to identify user. Please log in again."))
      }
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`${serverUrl()}/api/chat/symptoms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          patientId,
        }),
      })

      let data: any = null

      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        const errMsg = data?.details || data?.error || `AI request failed: ${res.status}`
        throw new Error(errMsg)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data?.response ||
          data?.reply ||
          data?.message ||
          getText(
            "aiFallbackError",
            "I'm sorry, I encountered an error processing your request. Please try again."
          ),
        timestamp: data?.timestamp || new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      console.error("[My Chat] AI failed:", err)
      toast.error("AI is currently busy. Please try again shortly.")

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "AI service is currently busy. Please try again later.\n\nIf you have chest pain, severe shortness of breath, fainting or stroke symptoms, please seek emergency help immediately.",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    getText("chatPromptVitals", "What do my recent vitals indicate?"),
    getText("chatPromptBreathless", "I'm feeling short of breath, what should I do?"),
    getText("chatPromptMedication", "What medicine do I need to take tonight?"),
    getText("chatPromptDoctor", "What signs mean I should call my doctor?"),
  ]

  const quickActions = [
    {
      label: "View my trends",
      icon: ClipboardList,
      text: "Can you explain my recent health trend?",
    },
    {
      label: "Medication reminders",
      icon: Pill,
      text: "What medication reminders do I have?",
    },
    {
      label: "Symptoms guide",
      icon: ShieldAlert,
      text: "What symptoms should I watch for today?",
    },
    {
      label: "When to seek help",
      icon: Stethoscope,
      text: "When should I contact doctor or emergency services?",
    },
  ]

  const displayName =
    patientSummary?.full_name ||
    [patientSummary?.first_name, patientSummary?.last_name].filter(Boolean).join(" ") ||
    "Patient"

  const latestBpS = dashboardSummary?.bpSystolic ?? patientSummary?.systolic_bp ?? null
  const latestBpD = dashboardSummary?.bpDiastolic ?? patientSummary?.diastolic_bp ?? null
  const latestHr = dashboardSummary?.heartRate ?? patientSummary?.heart_rate ?? null
  const latestWeight = dashboardSummary?.weightKg ?? null
  const dryWeight = patientSummary?.dry_weight ?? patientSummary?.baseline_weight ?? null
  const weightChange =
    latestWeight != null && dryWeight != null
      ? Number((latestWeight - dryWeight).toFixed(1))
      : null

  const meds =
    patientSummary?.current_medication
      ?.split(/\n|,|;/)
      .map((m) => m.trim())
      .filter(Boolean) || []

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-5">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Patient Summary</CardTitle>
                <CardDescription>Overview of key health information</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold text-slate-800">
                  <User className="h-4 w-4 text-sky-600" />
                  Basic Info
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-800">{displayName}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Age</span>
                  <span className="font-semibold text-slate-800">
                    {patientSummary?.age ?? "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Baseline Dry Weight</span>
                  <span className="font-semibold text-slate-800">
                    {dryWeight ? `${dryWeight} kg` : "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Height</span>
                  <span className="font-semibold text-slate-800">
                    {patientSummary?.height ? `${patientSummary.height} cm` : "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">BMI</span>
                  <span className="font-semibold text-slate-800">
                    {patientSummary?.bmi ? Number(patientSummary.bmi).toFixed(2) : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold text-slate-800">
                  <Activity className="h-4 w-4 text-sky-600" />
                  Latest Health Status
                </p>
                <span className="text-[11px] text-slate-400">
                  {dashboardSummary?.lastSyncTs
                    ? new Date(dashboardSummary.lastSyncTs).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Latest"}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Weight className="h-4 w-4 text-sky-500" />
                    Weight
                  </span>
                  <span className="font-bold text-slate-900">
                    {latestWeight ? `${latestWeight} kg` : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <HeartPulse className="h-4 w-4 text-rose-500" />
                    Blood Pressure
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {latestBpS && latestBpD ? `${latestBpS}/${latestBpD}` : "-"}
                    </span>
                    {getStatusBadge(getBpStatus(latestBpS, latestBpD) as any)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Activity className="h-4 w-4 text-red-500" />
                    Heart Rate
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {latestHr ? `${latestHr} bpm` : "-"}
                    </span>
                    {getStatusBadge(getHrStatus(latestHr) as any)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Footprints className="h-4 w-4 text-orange-500" />
                    Steps Today
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {dashboardSummary?.stepsToday ?? "-"}
                    </span>
                    {getStatusBadge(getStepsStatus(dashboardSummary?.stepsToday) as any)}
                  </div>
                </div>

                {weightChange != null && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Weight change:{" "}
                    <span
                      className={
                        weightChange >= 1.5
                          ? "font-bold text-amber-600"
                          : "font-bold text-emerald-600"
                      }
                    >
                      {weightChange > 0 ? "+" : ""}
                      {weightChange} kg
                    </span>{" "}
                    from baseline
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full rounded-xl"
                  onClick={() => handleSend(undefined, "Can you explain my latest health status?")}
                >
                  View Trends
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <Pill className="h-4 w-4 text-sky-600" />
                Medication Reminder
              </p>

              {meds.length > 0 ? (
                <div className="space-y-2">
                  {meds.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">{m}</span>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  No medication found.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full rounded-xl"
                onClick={() => handleSend(undefined, "What medicine do I need to take today?")}
              >
                View Medication Advice
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <Target className="h-4 w-4 text-sky-600" />
                Daily Goals
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                  <Footprints className="mx-auto mb-1 h-4 w-4 text-sky-600" />
                  <p className="text-xs text-slate-500">Steps</p>
                  <p className="font-bold text-slate-800">
                    {dashboardSummary?.stepsToday ?? 0}/3000
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                  <Droplets className="mx-auto mb-1 h-4 w-4 text-sky-600" />
                  <p className="text-xs text-slate-500">Water</p>
                  <p className="font-bold text-slate-800">Track</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-[calc(100vh-40px)] flex-col overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-sky-600" />
                  Chat with AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask about symptoms, reminders, medication, vitals or general health guidance.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleSend(undefined, "Show my patient summary.")}
              >
                <User className="mr-2 h-4 w-4" />
                Patient Summary
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-white p-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex w-full gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50">
                      <Bot className="h-5 w-5 text-sky-600" />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[76%] ${
                      m.role === "user"
                        ? "rounded-br-md bg-sky-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="markdown prose prose-sm max-w-none break-words prose-p:mb-2 prose-p:last:mb-0 prose-ul:pl-4">
                      <Markdown>{m.content}</Markdown>
                    </div>

                    <p
                      className={`mt-2 text-right text-[10px] ${
                        m.role === "user" ? "text-white/75" : "text-slate-400"
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {m.role === "user" && (
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex w-full justify-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50">
                    <Bot className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                    <span className="text-sm text-slate-500">
                      Analyzing your health data...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-5 py-3">
              {messages.length === 1 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    Suggested Questions
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(undefined, q)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Quick Actions</p>

                <div className="flex flex-wrap gap-2">
                  {quickActions.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleSend(undefined, item.text)}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                      >
                        <Icon className="h-3.5 w-3.5 text-sky-600" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={getText("chatInputPlaceholder", "Type your question here...")}
                  disabled={loading}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50"
                />

                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-12 rounded-xl bg-sky-600 px-4 hover:bg-sky-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>

            <div className="border-t border-amber-100 bg-amber-50 px-4 py-2">
              <div className="flex items-center justify-center gap-1.5 text-center">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                <p className="text-[11px] font-medium text-amber-800">
                  AI provides information, not diagnosis. Consult a doctor for medical advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}