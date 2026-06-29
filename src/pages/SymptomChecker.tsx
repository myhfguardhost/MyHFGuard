import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  age?: number | null
  dry_weight?: number | null
  current_medication?: string | null
  latest_weight?: number | null
  latest_weight_date?: string | null
  weight_change?: number | null
  latest_systolic?: number | null
  latest_diastolic?: number | null
  latest_bp_date?: string | null
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
  const scrollRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const userId = data?.session?.user?.id
      if (!userId) return


      const { data: patientData } = await supabase
        .from("patients")
        .select("patient_id")
        .eq("patient_id", userId)
        .maybeSingle()


      setPatientId(patientData?.patient_id || userId)


      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, age, dry_weight, current_medication")
        .eq("user_id", userId)
        .maybeSingle()


      const effectivePatientId = patientData?.patient_id || userId


      const [{ data: latestWeight }, { data: latestBp }] = await Promise.all([
        supabase
          .from("weight_day")
          .select("date, kg_avg, kg_min, kg_max")
          .eq("patient_id", effectivePatientId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bp_readings")
          .select("reading_date, reading_time, systolic, diastolic")
          .eq("patient_id", effectivePatientId)
          .order("reading_date", { ascending: false })
          .order("reading_time", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])


      const dryWeight = Number(profileData?.dry_weight)
      const latestWeightValue = Number(
        latestWeight?.kg_avg ?? latestWeight?.kg_max ?? latestWeight?.kg_min
      )


      if (profileData) {
        setPatientSummary({
          full_name: profileData.full_name,
          age: profileData.age,
          dry_weight: Number.isFinite(dryWeight) ? dryWeight : null,
          current_medication: profileData.current_medication,
          latest_weight: Number.isFinite(latestWeightValue) ? latestWeightValue : null,
          latest_weight_date: latestWeight?.date ?? null,
          weight_change:
            Number.isFinite(latestWeightValue) && Number.isFinite(dryWeight)
              ? latestWeightValue - dryWeight
              : null,
          latest_systolic: latestBp?.systolic ?? null,
          latest_diastolic: latestBp?.diastolic ?? null,
          latest_bp_date: latestBp?.reading_date ?? null,
        })
      }


      setMessages([
        {
          id: "1",
          role: "assistant",
          content: getText(
            "myChatWelcome",
            "Hello! I'm your MyHFGuard AI Chat Assistant. I can help answer questions based on your symptoms, reminders, medication and health data.\n\n**Important:** I am not a doctor and cannot diagnose conditions. If you have chest pain, severe breathing difficulty, or stroke symptoms, please seek emergency help immediately.\n\nHow can I help you today?"
          ),
          timestamp: new Date().toISOString(),
        },
      ])


      try {
        const res = await fetch(`${serverUrl()}/health`)
        if (!res.ok) throw new Error(String(res.status))
        console.log("[My Chat] backend health ok")
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
  }, [messages])


  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()


    if (!input.trim() || !patientId || loading) {
      if (!patientId) {
        toast.error(getText("userNotFound", "Unable to identify user. Please log in again."))
      }
      return
    }


    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
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
          patientSummary,
        }),
      })


      let data: any = null


      try {
        data = await res.json()
      } catch {
        data = null
      }


      if (!res.ok) {
        const errMsg =
          data?.details ||
          data?.error ||
          `AI request failed: ${res.status}`


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
          "AI is currently busy. Please try again shortly.\n\nIf you have chest pain, severe shortness of breath, fainting or stroke symptoms, please seek emergency help immediately.",
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


  const meds =
    patientSummary?.current_medication
      ?.split(/\n|;/)
      .map((m) => m.trim())
      .filter(Boolean) || []


  const formatKg = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}kg` : "-"


  const formatWeightChange = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-"
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}kg from baseline`
  }


  const latestBp =
    patientSummary?.latest_systolic && patientSummary?.latest_diastolic
      ? `${patientSummary.latest_systolic}/${patientSummary.latest_diastolic}`
      : "-"


  return (
    <main className="mx-auto max-w-6xl px-4 py-6 h-screen flex flex-col">
      <div className="mb-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {getText("myChatTitle", "My Chat")}
        </h2>
        <p className="text-muted-foreground">
          {getText(
            "myChatDesc",
            "Chat with AI assistant for support, guidance and heart health questions."
          )}
        </p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
        <Card className="min-h-0 overflow-hidden shadow-md">
          <CardHeader>
            <CardTitle>{getText("patientSummary", "Patient Summary")}</CardTitle>
            <CardDescription>
              {getText("patientSummaryDesc", "Basic data used to support AI responses")}
            </CardDescription>
          </CardHeader>


          <CardContent className="space-y-4 overflow-y-auto pb-4">
            <div className="border p-3 rounded-xl">
              <p className="font-medium mb-2">{getText("basicInfo", "Basic Info")}</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">{getText("name", "Name")}:</span>{" "}
                  <span className="font-medium">{patientSummary?.full_name || "-"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{getText("age", "Age")}:</span>{" "}
                  <span className="font-medium">{patientSummary?.age ?? "-"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {getText("baselineDryWeight", "Baseline Dry Weight")}:
                  </span>{" "}
                  <span className="font-medium">{formatKg(patientSummary?.dry_weight)}</span>
                </p>
              </div>
            </div>


            <div className="border p-3 rounded-xl">
              <p className="font-medium flex gap-2 items-center mb-2">
                <Activity className="w-4 h-4" />
                {getText("latestHealthStatus", "Latest Health Status")}
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">
                    {getText("latestWeight", "Latest Weight")}:
                  </span>{" "}
                  <span className="font-medium">{formatKg(patientSummary?.latest_weight)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {getText("weightChange", "Weight Change")}:
                  </span>{" "}
                  <span className="font-medium">{formatWeightChange(patientSummary?.weight_change)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{getText("latestBp", "Latest BP")}:</span>{" "}
                  <span className="font-medium">{latestBp}</span>
                </p>
              </div>
            </div>


            <div className="border p-3 rounded-xl overflow-hidden">
              <p className="font-medium flex gap-2 items-center mb-2">
                <Pill className="w-4 h-4 shrink-0" />
                {getText("medicationReminder", "Medication Reminder")}
              </p>


              {meds.length > 0 ? (
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {meds.map((m, i) => (
                    <div
                      key={i}
                      className="text-sm rounded-lg bg-muted/40 px-3 py-2 break-words"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {getText("noMedicationFound", "No medication found.")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>


        <Card className="flex flex-col min-h-0 overflow-hidden shadow-md">
          <CardHeader>
            <CardTitle>{getText("chatWithAssistant", "Chat with AI Assistant")}</CardTitle>
            <CardDescription>
              {getText(
                "chatWithAssistantDesc",
                "Ask about symptoms, reminders, medication, vitals or general health guidance."
              )}
            </CardDescription>
          </CardHeader>


          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}


                  <div
                    className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted/50 border rounded-bl-none"
                    }`}
                  >
                    <div className="markdown prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                      <Markdown>{m.content}</Markdown>
                    </div>
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        m.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>


                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}


              {loading && (
                <div className="flex gap-3 justify-start w-full animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {getText("aiAnalyzing", "Analyzing your health data...")}
                    </span>
                  </div>
                </div>
              )}
            </div>


            {messages.length === 1 && (
              <div className="p-3 border-t">
                <p className="text-xs mb-2">
                  {getText("suggestedQuestions", "Suggested Questions")}
                </p>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInput(q)}
                      className="border rounded-xl px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}


            <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-t border-b border-amber-100 dark:border-amber-900/50 flex justify-center">
              <div className="flex items-center gap-1.5 text-center">
                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">
                  {getText(
                    "aiMedicalDisclaimer",
                    "AI provides information, not diagnosis. Consult a doctor for medical advice."
                  )}
                </p>
              </div>
            </div>


            <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getText("chatInputPlaceholder", "Type your question here...")}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}