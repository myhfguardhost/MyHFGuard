import educationImg from "@/assets/education.jpg"
import selfCheckImg from "@/assets/selfcheck.jpg"
import waterImg from "@/assets/Water.jpg"
import exerciseImg from "@/assets/Exercise.jpg"
import reminderImg from "@/assets/reminder.jpg"
import supportImg from "@/assets/support.jpg"


import { useEffect, useState, memo } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Smartphone } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getPatientSummary, getPatientInfo, getPatientNotifications, markPatientNotificationRead, PatientNotification, serverUrl } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow, format } from "date-fns"
import { ms } from "date-fns/locale"
import { useLanguage } from "@/contexts/LanguageContext"


const Dashboard = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()


  const ClockDisplay = memo(() => {
    const [now, setNow] = useState(new Date())


    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(timer)
    }, [])


    return (
      <div className="text-left md:text-right">
        <p className="text-base md:text-lg font-medium text-muted-foreground">
          {format(now, "d MMM yyyy")}
        </p>
        <p className="text-3xl md:text-4xl font-bold text-primary">
          {format(now, "h:mm a")}
        </p>
      </div>
    )
  })


  const [patientId, setPatientId] = useState<string | undefined>(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("patientId") || undefined
      : undefined
  )


  const [showSyncNotice, setShowSyncNotice] = useState(true)
  const [notifications, setNotifications] = useState<PatientNotification[]>([])


  useEffect(() => {
    let mounted = true


    async function init() {
      if (patientId) return
      const { data } = await supabase.auth.getSession()
      const id = data?.session?.user?.id || undefined
      if (mounted) setPatientId(id)
    }


    init()
    return () => {
      mounted = false
    }
  }, [patientId])

  useEffect(() => {
    if (!patientId) return
    let active = true
    const load = () => getPatientNotifications(patientId).then((result) => active && setNotifications(result.notifications || [])).catch(() => {})
    load()
    const timer = setInterval(load, 60000)
    return () => { active = false; clearInterval(timer) }
  }, [patientId])

  async function markNotificationRead(notificationId: string) {
    if (!patientId) return
    await markPatientNotificationRead(patientId, notificationId)
    setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item))
  }


  const { data } = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => getPatientSummary(patientId),
    refetchOnWindowFocus: false,
    enabled: !!patientId,
  })


  const infoQuery = useQuery({
    queryKey: ["patient-info", patientId],
    queryFn: () => getPatientInfo(patientId),
    refetchOnWindowFocus: false,
    enabled: !!patientId,
  })


  useEffect(() => {
    async function syncIfDefault() {
      if (!patientId) return
      const pr = infoQuery.data?.patient
      const isDefault =
        !pr || (pr.first_name === "User" && pr.last_name === "Patient")
      if (!isDefault) return


      const { data } = await supabase.auth.getSession()
      const meta: any = data?.session?.user?.user_metadata || {}
      const firstName = meta.firstName
      const lastName = meta.lastName
      const dateOfBirth = meta.dateOfBirth


      if (!firstName && !lastName && !dateOfBirth) return


      try {
        await fetch(`${serverUrl()}/admin/ensure-patient`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, firstName, lastName, dateOfBirth }),
        })
        infoQuery.refetch()
      } catch (_) {}
    }


    syncIfDefault()
  }, [patientId, infoQuery.data])


  const summary = data?.summary || {}
  const lastSyncFromSummary = summary.lastSyncTs
    ? new Date(summary.lastSyncTs)
    : undefined


  const lastSyncDisplay =
    lastSyncFromSummary && !Number.isNaN(lastSyncFromSummary.getTime())
      ? formatDistanceToNow(lastSyncFromSummary, {
          addSuffix: true,
          locale: language === "BM" ? ms : undefined,
        })
      : summary.lastSyncTs || t("unknown")

  const getNotificationDisplay = (item: PatientNotification) => {
    if (language !== "BM") {
      return { title: item.title, message: item.message }
    }

    if (item.notification_type === "low_steps") {
      const steps = Number(item.metadata?.steps)
      const target = Number(item.metadata?.target)
      return {
        title: "Peringatan langkah harian",
        message:
          Number.isFinite(steps) && Number.isFinite(target)
            ? `Anda telah merekodkan ${steps.toLocaleString("ms-MY")} daripada sasaran harian ${target.toLocaleString("ms-MY")} langkah.`
            : "Sasaran langkah harian anda masih belum dicapai.",
      }
    }

    if (item.notification_type === "incomplete_vitals") {
      const missingLabels: Record<string, string> = {
        weight: "berat badan",
        "blood pressure": "tekanan darah",
        symptoms: "simptom",
      }
      const missing = Array.isArray(item.metadata?.missing)
        ? item.metadata.missing.map(
            (value: string) => missingLabels[value.toLowerCase()] || value
          )
        : []
      return {
        title: "Lengkapkan log vital hari ini",
        message:
          missing.length > 0
            ? `Log vital harian anda belum lengkap. Sila rekodkan: ${missing.join(", ")}.`
            : "Log vital harian anda masih belum lengkap.",
      }
    }

    return { title: item.title, message: item.message }
  }


  const homeComponents = [
    {
      title: t("myLearning"),
      description: t("myLearningDesc"),
      image: educationImg,
      action: () => navigate("/education"),
    },
    {
      title: t("mySelfCheck"),
      description: t("mySelfCheckDesc"),
      image: selfCheckImg,
      action: () =>
        navigate(
          patientId
            ? `/self-check?patientId=${encodeURIComponent(patientId)}`
            : "/self-check"
        ),
    },
    {
      title: t("myWaterDiet"),
      description: t("myWaterDietDesc"),
      image: waterImg,
      action: () => navigate("/water-diet"),
    },
    {
      title: t("myExercise"),
      description: t("myExerciseDesc"),
      image: exerciseImg,
      action: () => navigate("/exercise"),
    },
    {
      title: t("myMedicationReminder"),
      description: t("myMedicationReminderDesc"),
      image: reminderImg,
      action: () => navigate("/medication"),
    },
    {
      title: t("myChat"),
      description: t("myChatDesc"),
      image: supportImg,
      action: () => navigate("/ai-assistant"),
    },
  ]


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("dashboardWelcome")}, {infoQuery.data?.patient?.first_name || t("patient")}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {t("dashboardChooseSection")}
            </p>
          </div>
          <ClockDisplay />
        </div>


        {showSyncNotice && (
          <Alert className="mb-8 border-primary/40 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm">
            <Smartphone className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm md:text-base">
                <strong>{t("syncRequired")}</strong> {t("lastSynced")} {lastSyncDisplay}. {t("openAppToSync")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSyncNotice(false)}
                className="ml-4"
              >
                {t("dismiss")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {notifications.some((item) => !item.read_at) && (
          <Alert className="mb-8 border-cyan-300 bg-cyan-50 dark:bg-cyan-950/30">
            <Bell className="h-4 w-4 text-cyan-700" />
            <AlertDescription className="space-y-3">
              {notifications.filter((item) => !item.read_at).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{getNotificationDisplay(item).title}</strong>
                    <p>{getNotificationDisplay(item).message}</p>
                    <small>
                      {new Date(item.sent_at).toLocaleString(
                        language === "BM" ? "ms-MY" : "en-MY"
                      )}
                    </small>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => markNotificationRead(item.id)}><Check className="mr-1 h-4 w-4" />{t("markRead")}</Button>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeComponents.map((item) => (
            <Card
              key={item.title}
              onClick={item.action}
              className="cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div
                className="relative min-h-[220px] bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <div className="absolute inset-0 bg-black/45" />


                <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">{item.title}</h2>
                  <p className="text-sm md:text-base text-white/90 leading-6 max-w-[90%]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


export default Dashboard
