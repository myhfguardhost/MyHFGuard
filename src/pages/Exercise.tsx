import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import StableChart from "@/components/StableChart"
import { Button } from "@/components/ui/button"
import {
  Footprints,
  Activity,
  Target,
  BellRing,
  CheckCircle2,
  Smartphone,
  CalendarDays,
  Download,
  TrendingUp,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getPatientSummary, getPatientVitals } from "@/lib/api"
import { format, formatDistanceToNow, startOfWeek } from "date-fns"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const getWeekKey = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  return format(weekStart, "yyyy-MM-dd")
}

const Exercise = () => {
  const { t } = useLanguage()

  const [patientId, setPatientId] = useState<string | undefined>()
  const [selectedGoal, setSelectedGoal] =
    useState<string>("goalBetterSleep")
  const [hasSavedGoal, setHasSavedGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [goalLoading, setGoalLoading] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [collecting, setCollecting] = useState(false)

  const currentWeekKey = getWeekKey()

  const currentWeekLabel = `${t("weekOf")} ${format(
    new Date(`${currentWeekKey}T00:00:00`),
    "d MMM yyyy"
  )}`

  const weeklyGoals = [
    {
      key: "goalBetterSleep",
      label: t("goalBetterSleep"),
    },
    {
      key: "goalBoostedEnergy",
      label: t("goalBoostedEnergy"),
    },
    {
      key: "goalWalkWithEase",
      label: t("goalWalkWithEase"),
    },
    {
      key: "goalLessPain",
      label: t("goalLessPain"),
    },
    {
      key: "goalFeelBetter",
      label: t("goalFeelBetter"),
    },
    {
      key: "goalReducedBreathlessness",
      label: t("goalReducedBreathlessness"),
    },
    {
      key: "goalLessFatigue",
      label: t("goalLessFatigue"),
    },
    {
      key: "goalMoreHouseEnergy",
      label: t("goalMoreHouseEnergy"),
    },
    {
      key: "goalMoreSocialEnergy",
      label: t("goalMoreSocialEnergy"),
    },
    {
      key: "goalImprovedAppetite",
      label: t("goalImprovedAppetite"),
    },
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

        localStorage.setItem(
          `exerciseGoal:${uid}:${currentWeekKey}`,
          data.goal
        )
      } else {
        setHasSavedGoal(false)

        const legacyGoalKey = localStorage.getItem(
          `exerciseGoal:${uid}:${currentWeekKey}`
        )

        setSelectedGoal(legacyGoalKey || "goalBetterSleep")
      }
    } catch (err) {
      console.error("Failed to load weekly exercise goal", err)

      const legacyGoalKey = localStorage.getItem(
        `exerciseGoal:${uid}:${currentWeekKey}`
      )

      if (legacyGoalKey) {
        setSelectedGoal(legacyGoalKey)
      }

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

      if (uid) {
        await loadWeeklyGoal(uid)
      }
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

  const stepCount = Number(summary.stepsToday || 0)

  const spo2 = vitals.spo2?.length
    ? Math.round(
        Number(vitals.spo2[vitals.spo2.length - 1]?.avg || 0)
      )
    : 98

  const stepTargetValue = Number(
    summary.targetSteps ??
    summary.target_steps ??
    3000
  )

  const stepTarget =
    Number.isFinite(stepTargetValue) && stepTargetValue > 0
      ? stepTargetValue
      : 3000
  const baselineSteps = 2000

  const stepProgress = Math.min(
    100,
    Math.round((stepCount / stepTarget) * 100)
  )

  const stepGap = Math.max(0, stepTarget - stepCount)
  const toleratedWell = stepCount >= baselineSteps
  const targetReached = stepCount >= stepTarget

  const syncDisplay = summary.lastSyncTs
    ? formatDistanceToNow(new Date(summary.lastSyncTs), {
        addSuffix: true,
      })
    : t("notSyncedYet")

  const recommendation = useMemo(() => {
    if (targetReached) {
      return t("exerciseRecommendationReached")
    }

    if (toleratedWell) {
      return t("exerciseRecommendationGood")
    }

    return t("exerciseRecommendationSlow")
  }, [targetReached, toleratedWell, t])

  const weeklyStepsData = useMemo(() => {
    const weekData = [
      { day: "Mon", steps: 0 },
      { day: "Tue", steps: 0 },
      { day: "Wed", steps: 0 },
      { day: "Thu", steps: 0 },
      { day: "Fri", steps: 0 },
      { day: "Sat", steps: 0 },
      { day: "Sun", steps: 0 },
    ]

    ;(vitals.steps || []).forEach((item: any) => {
      const rawTime =
        item?.time ??
        item?.date ??
        item?.created_at ??
        item?.time_ts

      if (!rawTime) return

      const parsedDate = new Date(rawTime)

      if (Number.isNaN(parsedDate.getTime())) return

      const day = format(parsedDate, "EEE")
      const row = weekData.find((entry) => entry.day === day)

      if (!row) return

      row.steps += Number(
        item?.count ??
          item?.steps ??
          item?.total_steps ??
          item?.value ??
          0
      )
    })

    return weekData
  }, [vitals.steps])

  const weeklyMaximum = useMemo(() => {
    const highestSteps = Math.max(
      stepTarget,
      ...weeklyStepsData.map((item) => item.steps)
    )

    return Math.ceil(highestSteps / 1000) * 1000
  }, [weeklyStepsData])

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

      localStorage.setItem(
        `exerciseGoal:${patientId}:${currentWeekKey}`,
        selectedGoal
      )

      setHasSavedGoal(true)
      setGoalSaved(true)

      toast.success(t("goalSaved"))

      setTimeout(() => {
        setGoalSaved(false)
      }, 2000)
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
      await Promise.all([
        summaryQuery.refetch(),
        vitalsQuery.refetch(),
      ])

      toast.success(t("latestExerciseLoaded"))
    } catch (err) {
      console.error("Failed to load latest exercise data", err)
      toast.error(t("failedExerciseLoad"))
    } finally {
      setCollecting(false)
    }
  }

  const currentGoalLabel =
    weeklyGoals.find((goal) => goal.key === selectedGoal)?.label ||
    t("goalBetterSleep")

  return (
    <div className="min-h-screen bg-background px-3 py-4 text-foreground sm:px-4 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("exerciseTitle")}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {t("exerciseDesc")}
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                {t("lastSynced")}
              </p>

              <p className="font-medium">{syncDisplay}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:col-span-2">
            <div className="border-b border-border bg-muted/30 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      {t("weeklyGoal")}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {t("selectGoal")}
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {currentWeekLabel}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {weeklyGoals.map((goal) => {
                  const isSelected = selectedGoal === goal.key

                  return (
                    <button
                      key={goal.key}
                      type="button"
                      onClick={() => {
                        if (
                          !hasSavedGoal &&
                          !goalLoading &&
                          !savingGoal
                        ) {
                          setSelectedGoal(goal.key)
                        }
                      }}
                      disabled={
                        hasSavedGoal ||
                        goalLoading ||
                        savingGoal
                      }
                      className={`min-h-[54px] rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent hover:shadow-sm"
                      }`}
                    >
                      {goal.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveGoal}
                  disabled={
                    hasSavedGoal ||
                    goalLoading ||
                    savingGoal
                  }
                  className="min-w-[130px] rounded-xl"
                >
                  {goalLoading || savingGoal
                    ? t("saving")
                    : hasSavedGoal
                      ? t("alreadySavedThisWeek")
                      : t("saveGoal")}
                </Button>

                {goalSaved && (
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("goalSaved")}
                  </p>
                )}
              </div>

              {hasSavedGoal && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("goalAlreadySavedInfo")}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("currentGoal")}
                  </p>

                  <p className="mt-1 text-lg font-semibold text-primary">
                    {currentGoalLabel}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleCollectData}
              disabled={
                collecting ||
                summaryQuery.isFetching ||
                vitalsQuery.isFetching
              }
              className="flex min-h-[88px] w-full items-center justify-center gap-3 rounded-3xl text-base font-semibold shadow-sm"
            >
              <Download
                className={`h-5 w-5 ${
                  collecting ||
                  summaryQuery.isFetching ||
                  vitalsQuery.isFetching
                    ? "animate-bounce"
                    : ""
                }`}
              />

              {collecting ||
              summaryQuery.isFetching ||
              vitalsQuery.isFetching
                ? t("collecting")
                : t("collectData")}
            </Button>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/10">
                    <Footprints className="h-5 w-5 text-yellow-500" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {t("dailyTarget")}
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      {t("minimumTarget")}
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-yellow-500">
                    {stepTarget}
                  </span>

                  <span className="pb-1 text-sm text-muted-foreground">
                    {t("stepsPerDay")}
                  </span>
                </div>

                <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${stepProgress}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {stepCount} / {stepTarget}
                  </span>

                  <span className="font-semibold text-primary">
                    {stepProgress}%
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium">
                  {targetReached
                    ? t("targetAchieved")
                    : `${stepGap} ${t("stepsRemaining")}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/10">
                    <Activity className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>

                  <h3 className="font-semibold">
                    {t("oximetry")}
                  </h3>
                </div>

                <div className="text-3xl font-bold">{spo2}%</div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {t("spo2Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/10">
                    <BellRing className="h-5 w-5 text-yellow-500" />
                  </div>

                  <h3 className="font-semibold">
                    {t("exerciseReminder")}
                  </h3>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {recommendation}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Footprints className="h-6 w-6 text-primary" />
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {stepProgress}%
                  </span>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  {t("stepCount")}
                </p>

                <div className="mt-2 text-5xl font-bold tracking-tight">
                  {stepCount.toLocaleString()}
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {t("todaySteps")}
                </p>
              </div>

              <div className="mt-8 rounded-2xl bg-muted/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("dailyTarget")}
                  </span>

                  <span className="font-semibold">
                    {stepTarget.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${stepProgress}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle className="text-lg">
                      {t("weeklyStepTrend")}
                    </CardTitle>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentWeekLabel}
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  7 Days
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div className="h-[280px] w-full">
                <StableChart height={280}>
                  <BarChart
                    data={weeklyStepsData}
                    margin={{
                      top: 12,
                      right: 12,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.35}
                    />

                    <XAxis
                      dataKey="day"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      hide
                      domain={[0, weeklyMaximum]}
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(14, 165, 233, 0.08)",
                      }}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} steps`,
                        t("stepCount"),
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                      }}
                    />

                    <ReferenceLine
                      y={stepTarget}
                      stroke="#f59e0b"
                      strokeDasharray="6 6"
                      label={{
                        value: `${stepTarget} target`,
                        position: "insideTopRight",
                        fontSize: 11,
                      }}
                    />

                    <Bar
                      dataKey="steps"
                      radius={[8, 8, 0, 0]}
                      fill="#0ea5e9"
                      maxBarSize={54}
                    />
                  </BarChart>
                </StableChart>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-3xl border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {t("exerciseNotes")}
                </h2>

                <p className="mt-2 leading-6 text-muted-foreground">
                  {t("exerciseNotesDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Exercise