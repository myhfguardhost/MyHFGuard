import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import StableChart from "@/components/StableChart"
import { Button } from "@/components/ui/button"
import {
  Footprints,
  MapPinned,
  Timer,
  Activity,
  Target,
  BellRing,
  CheckCircle2,
  Smartphone,
  CalendarDays,
  Download,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getPatientSummary, getPatientVitals } from "@/lib/api"
import { format, formatDistanceToNow, startOfWeek } from "date-fns"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import { CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"


const getWeekKey = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  return format(weekStart, "yyyy-MM-dd")
}


const Exercise = () => {
  const { t } = useLanguage()
  const [patientId, setPatientId] = useState<string | undefined>()
  const [selectedGoal, setSelectedGoal] = useState<string>("goalBetterSleep")
  const [hasSavedGoal, setHasSavedGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [goalLoading, setGoalLoading] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [collecting, setCollecting] = useState(false)


  const currentWeekKey = getWeekKey()
  const currentWeekLabel = `${t("weekOf")} ${format(new Date(currentWeekKey), "d MMM yyyy")}`


  const weeklyGoals = [
    { key: "goalBetterSleep", label: t("goalBetterSleep") },
    { key: "goalBoostedEnergy", label: t("goalBoostedEnergy") },
    { key: "goalWalkWithEase", label: t("goalWalkWithEase") },
    { key: "goalLessPain", label: t("goalLessPain") },
    { key: "goalFeelBetter", label: t("goalFeelBetter") },
    { key: "goalReducedBreathlessness", label: t("goalReducedBreathlessness") },
    { key: "goalLessFatigue", label: t("goalLessFatigue") },
    { key: "goalMoreHouseEnergy", label: t("goalMoreHouseEnergy") },
    { key: "goalMoreSocialEnergy", label: t("goalMoreSocialEnergy") },
    { key: "goalImprovedAppetite", label: t("goalImprovedAppetite") },
  ]


  const loadWeeklyGoal = async (uid: string) => {
    setGoalLoading(true)


    try {
      const { data, error } = await supabase
        .from("exercise_goals")
        .select("goal, week_key, created_at")
        .eq("patient_id", uid)
        .eq("week_key", currentWeekKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()


      if (error) throw error


      if (data?.goal) {
        setSelectedGoal(data.goal)
        setHasSavedGoal(true)
        localStorage.setItem(`exerciseGoal:${uid}:${currentWeekKey}`, data.goal)
      } else {
        setHasSavedGoal(false)
        const legacyGoalKey = localStorage.getItem(`exerciseGoal:${uid}:${currentWeekKey}`)
        setSelectedGoal(legacyGoalKey || "goalBetterSleep")
      }
    } catch (err) {
      console.error("Failed to load weekly exercise goal", err)
      const legacyGoalKey = localStorage.getItem(`exerciseGoal:${uid}:${currentWeekKey}`)
      if (legacyGoalKey) setSelectedGoal(legacyGoalKey)
      toast.error(t("goalLoadFailed"))
    } finally {
      setGoalLoading(false)
    }
  }


  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const uid = data?.session?.user?.id
      setPatientId(uid)
      if (uid) await loadWeeklyGoal(uid)
    }
    init()
  }, [currentWeekKey])


  const summaryQuery = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => getPatientSummary(patientId),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  })


  const vitalsQuery = useQuery({
    queryKey: ["patient-vitals-exercise", patientId],
    queryFn: () => getPatientVitals(patientId, "hourly"),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  })


  const summary = summaryQuery.data?.summary || {}
  const vitals = vitalsQuery.data?.vitals || {}


  const stepCount = summary.stepsToday || 0
  const distanceKm = summary.distanceToday || 0
  const exerciseMinutes = stepCount > 0 ? Math.max(10, Math.round(stepCount / 100)) : 0
  const spo2 = vitals.spo2?.length ? Math.round(vitals.spo2[vitals.spo2.length - 1].avg || 0) : 98


  const stepTarget = 3000
  const baselineSteps = 2000
  const stepProgress = Math.min(100, Math.round((stepCount / stepTarget) * 100))
  const stepGap = Math.max(0, stepTarget - stepCount)
  const toleratedWell = stepCount >= baselineSteps
  const targetReached = stepCount >= stepTarget


  const syncDisplay = summary.lastSyncTs
    ? formatDistanceToNow(new Date(summary.lastSyncTs), { addSuffix: true })
    : t("notSyncedYet")


  const recommendation = useMemo(() => {
    if (targetReached) return t("exerciseRecommendationReached")
    if (toleratedWell) return t("exerciseRecommendationGood")
    return t("exerciseRecommendationSlow")
  }, [targetReached, toleratedWell, t])


  const weeklyStepsData = [
    { day: "Mon", steps: 0 },
    { day: "Tue", steps: 0 },
    { day: "Wed", steps: 0 },
    { day: "Thu", steps: 0 },
    { day: "Fri", steps: 0 },
    { day: "Sat", steps: 0 },
    { day: "Sun", steps: 0 },
  ]


  ;(vitals.steps || []).forEach((item: any) => {
    const day = format(new Date(item.time), "EEE")


    const row = weeklyStepsData.find((d) => d.day === day)


    if (row) {
      row.steps += Number(item.count || item.steps || item.value || 0)
    }
  })


  const handleSaveGoal = async () => {
    if (!patientId) {
      toast.error(t("userNotFound"))
      return
    }


    if (hasSavedGoal) {
      toast.info(t("goalAlreadySavedInfo"))
      return
    }


    setSavingGoal(true)


    try {
      const { error } = await supabase
        .from("exercise_goals")
        .insert([
          {
            patient_id: patientId,
            week_key: currentWeekKey,
            goal: selectedGoal,
          },
        ])


      if (error) {
        if (error.code === "23505") {
          setHasSavedGoal(true)
          await loadWeeklyGoal(patientId)
          toast.info(t("goalAlreadyExistsInSupabase"))
          return
        }


        throw error
      }


      localStorage.setItem(`exerciseGoal:${patientId}:${currentWeekKey}`, selectedGoal)
      setHasSavedGoal(true)
      setGoalSaved(true)
      toast.success(t("goalSaved"))
      setTimeout(() => setGoalSaved(false), 2000)
    } catch (err) {
      console.error("Failed to save weekly exercise goal", err)
      toast.error(t("goalSaveFailed"))
    } finally {
      setSavingGoal(false)
    }
  }


  const handleCollectData = async () => {
    if (!patientId) {
      toast.error(t("userNotFound"))
      return
    }


    setCollecting(true)
    try {
      await Promise.all([summaryQuery.refetch(), vitalsQuery.refetch()])
      toast.success(t("latestExerciseLoaded"))
    } catch (err) {
      toast.error(t("failedExerciseLoad"))
    } finally {
      setCollecting(false)
    }
  }


  const currentGoalLabel = weeklyGoals.find((goal) => goal.key === selectedGoal)?.label || t("goalBetterSleep")


  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{t("exerciseTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("exerciseDesc")}</p>
          </div>


          <div className="flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>{t("lastSynced")} : {syncDisplay}</span>
          </div>
        </div>


        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Target className="text-primary" />
              <h2 className="text-xl font-semibold">{t("weeklyGoal")}</h2>
            </div>


            <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {currentWeekLabel}
            </div>


            <p className="mb-3 text-muted-foreground">{t("selectGoal")}</p>


            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {weeklyGoals.map((goal) => (
                <button
                  key={goal.key}
                  onClick={() => {
                    if (!hasSavedGoal && !goalLoading && !savingGoal) setSelectedGoal(goal.key)
                  }}
                  disabled={hasSavedGoal || goalLoading || savingGoal}
                  className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    selectedGoal === goal.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>


            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleSaveGoal} disabled={hasSavedGoal || goalLoading || savingGoal}>
                {goalLoading || savingGoal ? t("saving") : hasSavedGoal ? t("alreadySavedThisWeek") : t("saveGoal")}
              </Button>
              {hasSavedGoal && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("goalAlreadySavedInfo")}
                </p>
              )}
              {goalSaved && (
                <p className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("goalSaved")}
                </p>
              )}
            </div>


            <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-sm text-muted-foreground">{t("currentGoal")}</p>
              <p className="mt-1 text-lg font-semibold text-primary">{currentGoalLabel}</p>
            </div>
          </Card>


          <div className="flex flex-col gap-4">
            <Button onClick={handleCollectData} className="flex h-[120px] w-full items-center justify-center gap-2 text-lg font-semibold">
              <Download className="h-5 w-5" />
              {collecting || summaryQuery.isFetching || vitalsQuery.isFetching ? t("collecting") : t("collectData")}
            </Button>


            <Card className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <Footprints className="text-yellow-500" />
                <h2 className="text-xl font-semibold">{t("dailyTarget")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t("minimumTarget")}</p>
              <div className="mt-2 text-4xl font-bold text-yellow-500">{stepTarget}</div>
              <p className="text-sm text-muted-foreground">{t("stepsPerDay")}</p>
              <div className="mt-4 h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${stepProgress}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-muted-foreground">{stepCount} / {stepTarget} {t("stepsCompleted")}</p>
                <p className="font-medium">{targetReached ? t("targetAchieved") : `${stepGap} ${t("stepsRemaining")}`}</p>
              </div>
            </Card>


            <Card className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="text-pink-600 dark:text-pink-400" />
                <h3 className="font-semibold">{t("oximetry")}</h3>
              </div>
              <div className="text-3xl font-bold">{spo2}%</div>
              <p className="mt-2 text-muted-foreground">{t("spo2Desc")}</p>
            </Card>


            <Card className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <BellRing className="text-yellow-500" />
                <h3 className="font-semibold">{t("exerciseReminder")}</h3>
              </div>
              <p className="text-muted-foreground">{recommendation}</p>
            </Card>
          </div>
        </div>


        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Footprints className="text-primary" />
              <h3 className="font-semibold">{t("stepCount")}</h3>
            </div>
            <div className="text-3xl font-bold">{stepCount}</div>
            <p className="mt-2 text-muted-foreground">{t("todaySteps")}</p>
          </Card>


          <Card className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned className="text-green-600 dark:text-green-400" />
              <h3 className="font-semibold">{t("distance")}</h3>
            </div>
            <div className="text-3xl font-bold">{distanceKm} km</div>
            <p className="mt-2 text-muted-foreground">{t("distanceDesc")}</p>
          </Card>


          <Card className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Timer className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold">{t("exerciseTime")}</h3>
            </div>
            <div className="text-3xl font-bold">{exerciseMinutes} min</div>
            <p className="mt-2 text-muted-foreground">{t("exerciseTimeDesc")}</p>
          </Card>


          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t("weeklyStepTrend")}
              </CardTitle>
            </CardHeader>


            <CardContent>
              <div className="h-[180px]">
                <StableChart height={180}>
                  <BarChart data={weeklyStepsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis hide />
                    <Tooltip />


                    <Bar
                      dataKey="steps"
                      radius={[6, 6, 0, 0]}
                      fill="#0ea5e9"
                    />
                  </BarChart>
                </StableChart>
              </div>
            </CardContent>
          </Card>
        </div>


        <Card className="mt-6 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold">{t("exerciseNotes")}</h2>
          <p className="mt-2 text-muted-foreground">{t("exerciseNotesDesc")}</p>
        </Card>
      </div>
    </div>
  )
}


export default Exercise