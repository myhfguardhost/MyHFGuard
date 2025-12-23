import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Weight, AlertCircle, Activity, Camera, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Minus, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { postWeightSample, postSymptomLog, getDailyStatus, getWeeklyStatus } from "@/lib/api"
import { format, addDays, subDays, isSameDay, parseISO, isToday } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const SelfCheck = () => {
  const [patientId, setPatientId] = useState<string | undefined>(
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("patientId")
        || new URLSearchParams((window.location.hash.split("?")[1]) || "").get("patientId")
        || undefined)
      : undefined
  )
  const [activeTab, setActiveTab] = useState<"weight" | "symptoms">(
    typeof window !== "undefined"
      ? ((new URLSearchParams(window.location.search).get("tab") === "symptoms"
          || new URLSearchParams((window.location.hash.split("?")[1]) || "").get("tab") === "symptoms") ? "symptoms" : "weight")
      : "weight"
  )
  const [weightKg, setWeightKg] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dailyStatus, setDailyStatus] = useState<{ has_weight: boolean; has_bp: boolean; has_symptoms: boolean }>({ has_weight: false, has_bp: false, has_symptoms: false })
  const [weeklyStatus, setWeeklyStatus] = useState<Record<string, { has_weight: boolean; has_symptoms: boolean }>>({})
  const [symptoms, setSymptoms] = useState<Record<string, number>>({
    cough: 0,
    breathlessness: 0,
    swelling: 0,
    weightGain: 0,
    abdomen: 0,
    sleeping: 0,
  })
  
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [showSuccessCard, setShowSuccessCard] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; desc: string; action: () => void; isAlert?: boolean }>({
    open: false,
    title: "",
    desc: "",
    action: () => {},
    isAlert: false,
  })

  useEffect(() => {
    let mounted = true
    async function init() {
      if (patientId) return
      const { data } = await supabase.auth.getSession()
      const id = data?.session?.user?.id || undefined
      if (mounted) setPatientId(id)
    }
    init()
    return () => { mounted = false }
  }, [patientId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams((window.location.hash.split("?")[1]) || "")
    const t = search.get("tab") || hash.get("tab")
    if (t === "symptoms") setActiveTab("symptoms")
    else setActiveTab("weight")
  }, [])

  useEffect(() => {
    if (!patientId) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    getDailyStatus(patientId, dateStr).then(setDailyStatus)
    getWeeklyStatus(patientId, format(new Date(), 'yyyy-MM-dd')).then(setWeeklyStatus)
  }, [patientId, selectedDate, submitting])

  async function submitWeightLog() {
    setConfirmDialog(prev => ({ ...prev, open: false }))
    setSubmitting(true)
    try {
      const kg = parseFloat(weightKg)
      // Use 12:00 PM for backdated entries to avoid timezone shifts, or current time for today
      const timeTs = isToday(selectedDate) ? new Date().toISOString() : new Date(format(selectedDate, 'yyyy-MM-dd') + 'T12:00:00').toISOString()
      
      const res = await postWeightSample({ patientId: patientId!, kg, timeTs })
      if ((res as any)?.error) throw new Error((res as any).error)
      setToast({ type: 'success', message: 'Weight saved' })
      setTimeout(() => setToast(null), 3000)
      setWeightKg("")
      
      // Refresh status
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      getDailyStatus(patientId!, dateStr).then(setDailyStatus)
    } catch (e: any) {
      console.error(e)
      setToast({ type: 'error', message: e.message || 'Failed to save weight' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogWeight = () => {
    if (!patientId || !weightKg) return
    const kg = parseFloat(weightKg)
    if (isNaN(kg) || kg < 20) {
      setConfirmDialog({
        open: true,
        title: "Invalid Weight",
        desc: "Please enter a valid weight of at least 20kg.",
        action: () => setConfirmDialog(prev => ({ ...prev, open: false })),
        isAlert: true,
      })
      return
    }
    setConfirmDialog({
      open: true,
      title: "MyHFGuard",
      desc: `Are you sure you want to submit this weight reading for ${format(selectedDate, 'MMM d')}?`,
      action: submitWeightLog,
      isAlert: false,
    })
  }

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightKg) || 60
    const next = Math.round((current + delta) * 10) / 10
    if (next > 0) setWeightKg(next.toFixed(1))
  }

  async function submitSymptomLog() {
    setConfirmDialog(prev => ({ ...prev, open: false }))
    setSubmitting(true)
    try {
      const timeTs = isToday(selectedDate) ? new Date().toISOString() : new Date(format(selectedDate, 'yyyy-MM-dd') + 'T12:00:00').toISOString()
      const res = await postSymptomLog({ patientId: patientId!, ...symptoms, notes: JSON.stringify(symptoms), timeTs })
      if ((res as any)?.error) throw new Error((res as any).error)
      setToast({ type: 'success', message: 'Symptoms saved' })
      setTimeout(() => setToast(null), 3000)
      
      // Refresh status
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      getDailyStatus(patientId!, dateStr).then(setDailyStatus)
    } catch (e: any) {
      console.error(e)
      setToast({ type: 'error', message: e.message || 'Failed to save symptoms' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogSymptoms = () => {
    if (!patientId) return
    setConfirmDialog({
      open: true,
      title: "MyHFGuard",
      desc: `Are you sure you want to submit these symptom ratings for ${format(selectedDate, 'MMM d')}?`,
      action: submitSymptomLog,
    })
  }

  const handleDateChange = (days: number) => {
    const newDate = addDays(selectedDate, days)
    if (newDate > new Date()) return
    setSelectedDate(newDate)
  }

  const handleAllowPermissions = () => {}
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Self Check Toolkits</CardTitle>
          <CardDescription className="text-center">Log your daily measurements and symptoms</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Week View Strip */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex justify-between gap-2 min-w-max px-1">
              {Array.from({ length: 7 }, (_, i) => {
                 const d = new Date()
                 d.setDate(d.getDate() - (6 - i))
                 return d
              }).map((d) => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const st = weeklyStatus[dateStr] || { has_weight: false, has_symptoms: false }
                const isSelected = isSameDay(d, selectedDate)
                const isDayToday = isToday(d)
                return (
                  <div 
                    key={dateStr}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer min-w-[50px] transition-all border",
                      isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-transparent shadow-sm",
                      isDayToday && !isSelected && "border-primary/50 border-dashed"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-70">{format(d, 'EEE')}</span>
                    <span className="text-lg font-bold leading-none my-1">{format(d, 'd')}</span>
                    <div className="flex gap-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", st.has_weight ? "bg-green-500" : "bg-red-300")} title="Weight" />
                      <div className={cn("w-1.5 h-1.5 rounded-full", st.has_symptoms ? "bg-green-500" : "bg-red-300")} title="Symptoms" />
                    </div>
                  </div>
                )
              })}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-auto w-12 rounded-lg border-dashed">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
             <p className="text-xs text-muted-foreground text-center mt-2 flex justify-center gap-4">
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-300 mr-1"/> Missing</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"/> Completed</span>
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weight">Daily Weight</TabsTrigger>
              <TabsTrigger value="symptoms">Symptoms Rating</TabsTrigger>
            </TabsList>

            <TabsContent value="weight">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Weight className="w-5 h-5 text-primary" />
                    Daily Weight (kg)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <div className="flex gap-3 items-center">
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => adjustWeight(-0.1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input id="weight" type="number" placeholder="68.5" className="flex-1 text-center text-lg h-10" step="0.1" value={weightKg} onChange={e=>setWeightKg(e.target.value)} />
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => adjustWeight(0.1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Use weighing scale or smart detection</p>
                  </div>
                  {dailyStatus.has_weight ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        You have already logged weight for {isToday ? "today" : format(selectedDate, 'd MMM')}.
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleLogWeight} 
                      disabled={submitting || !patientId || !weightKg}
                    >
                      {!patientId ? "Loading patient info..." : (!weightKg ? "Enter Weight to Submit" : (submitting ? "Saving..." : "Log Weight"))}
                    </Button>
                  )}
                  {!patientId && !dailyStatus.has_weight && <p className="text-xs text-center text-muted-foreground mt-2">Fetching patient details...</p>}
                  {!weightKg && patientId && !dailyStatus.has_weight && <p className="text-xs text-center text-muted-foreground mt-2">Please enter your weight above to enable submission.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="symptoms">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Symptoms Rating
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Rate each symptom: 0 = No symptom, 1 = Mild, 5 = Severe</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { id: "cough", label: "Cough" },
                    { id: "breathlessness", label: "Shortness of breath when active" },
                    { id: "swelling", label: "Swelling of legs" },
                    { id: "weightGain", label: "Sudden weight gain > 2kg in 3 days" },
                    { id: "abdomen", label: "Discomfort/swelling in abdomen" },
                    { id: "sleeping", label: "Breathless when sleeping" },
                  ].map((symptom) => (
                    <div key={symptom.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={symptom.id}>{symptom.label}</Label>
                        <span className="text-sm font-semibold text-primary">{symptoms[symptom.id] ?? 0}</span>
                      </div>
                      <Slider id={symptom.id} value={[symptoms[symptom.id] ?? 0]} max={5} step={1} className="w-full" onValueChange={(v)=>{
                        const key = symptom.id
                        setSymptoms((s)=>({ ...s, [key]: v[0] }))
                      }} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>No symptom</span>
                        <span>Mild</span>
                        <span>Severe</span>
                      </div>
                    </div>
                  ))}

                  {dailyStatus.has_symptoms ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        You have already logged symptoms for {isToday(selectedDate) ? "today" : format(selectedDate, 'd MMM')}.
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleLogSymptoms} disabled={submitting || !patientId}>Log Symptoms</Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className={toast.type === 'success' ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}>
            <CardContent className="p-3 text-sm">
              {toast.message}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {!confirmDialog.isAlert && <Button variant="ghost" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>}
            <Button onClick={confirmDialog.action}>{confirmDialog.isAlert ? "OK" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SelfCheck
