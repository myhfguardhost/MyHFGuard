import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  HeartPulse,
  Pill,
  Coins,
  Save,
  Lock,
  RefreshCw,
} from "lucide-react"
import { useTranslation } from "react-i18next"


import { supabase } from "@/lib/supabase"
import { getUserCoins } from "@/lib/coinService"


type ProfileForm = {
  fullName: string
  age: string
  ic: string
  systolicBP: string
  diastolicBP: string
  heartRate: string
  dryWeight: string
  height: string
  currentMedication: string
  language: "BM" | "BI"
  coins: number
}


const Profile = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()


  const getCurrentProfileLanguage = (): "BM" | "BI" => {
    return i18n.language === "ms" ? "BM" : "BI"
  }


  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    age: "",
    ic: "",
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    dryWeight: "",
    height: "",
    currentMedication: "",
    language: getCurrentProfileLanguage(),
    coins: 0,
  })




  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshingCoins, setRefreshingCoins] = useState(false)
  const [isLocked, setIsLocked] = useState(false)




  const bmi = useMemo(() => {
    const weight = parseFloat(form.dryWeight)
    const heightCm = parseFloat(form.height)




    if (!weight || !heightCm) return ""




    const heightM = heightCm / 100
    const result = weight / (heightM * heightM)




    return result.toFixed(2) // 2 decimal places
  }, [form.dryWeight, form.height])




  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])




  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      language: getCurrentProfileLanguage(),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])




  const loadProfile = async () => {
    try {
      setLoading(true)




      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user




      if (!user) {
        setLoading(false)
        return
      }




      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()




      if (error) {
        console.error("Load profile error:", error)
        setLoading(false)
        return
      }




      if (data) {
        setForm({
          fullName: data.full_name || "",
          age: data.age?.toString() || "",
          ic: data.ic || "",
          systolicBP: data.systolic_bp?.toString() || "",
          diastolicBP: data.diastolic_bp?.toString() || "",
          heartRate: data.heart_rate?.toString() || "",
          dryWeight: data.dry_weight?.toString() || "",
          height: data.height?.toString() || "",
          currentMedication: data.current_medication || "",
          language: getCurrentProfileLanguage(),
          coins: data.coins || 0,
        })




        setIsLocked(!!data.baseline_locked)




        if (data.profile_completed) {
          localStorage.setItem("profileCompleted", "true")
        }
      }
    } catch (err) {
      console.error("Unexpected profile load error:", err)
    } finally {
      setLoading(false)
    }
  }




  const refreshCoins = async () => {
    try {
      setRefreshingCoins(true)
      const latestCoins = await getUserCoins()




      setForm((prev) => ({
        ...prev,
        coins: latestCoins,
      }))
    } catch (error) {
      console.error("Refresh coins error:", error)
      alert(t("coin.failedToRefreshCoins"))
    } finally {
      setRefreshingCoins(false)
    }
  }




  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target




    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }




  const handleSave = async () => {
    try {
      setSaving(true)




      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user




      if (!user) {
        alert(t("profile.userSessionNotFound"))
        return
      }




      const latestCoins = await getUserCoins().catch(() => form.coins)
      const currentLanguage = getCurrentProfileLanguage()




      const profileData = {
        user_id: user.id,
        full_name: form.fullName,
        age: form.age ? Number(form.age) : null,
        ic: form.ic,
        systolic_bp: form.systolicBP ? Number(form.systolicBP) : null,
        diastolic_bp: form.diastolicBP ? Number(form.diastolicBP) : null,
        heart_rate: form.heartRate ? Number(form.heartRate) : null,
        dry_weight: form.dryWeight ? Number(form.dryWeight) : null,
        height: form.height ? Number(form.height) : null,
        bmi: bmi ? Number(bmi) : null,
        current_medication: form.currentMedication,
        language: currentLanguage,
        coins: latestCoins,
        profile_completed: true,
        baseline_locked: true,
        updated_at: new Date().toISOString(),
      }




      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" })




      if (error) {
        console.error("Save profile error:", error)
        alert(t("profile.failedToSaveProfile"))
        return
      }




      setForm((prev) => ({
        ...prev,
        coins: latestCoins,
        language: currentLanguage,
      }))




      localStorage.setItem("profileCompleted", "true")
      setIsLocked(true)




      alert(t("profile.profileSavedSuccessfully"))
      navigate("/")
    } catch (err) {
      console.error("Unexpected profile save error:", err)
      alert(t("profile.somethingWentWrongSaving"))
    } finally {
      setSaving(false)
    }
  }




  const baselineInputClass =
    "w-full rounded-xl bg-background border border-border px-4 py-3 text-foreground outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"




  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-8 flex items-center justify-center">
        <div className="text-lg font-medium">{t("profile.loadingProfile")}</div>
      </div>
    )
  }




  return (
    <div className="min-h-screen bg-background text-foreground px-3 py-4 sm:px-4 md:px-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{t("profile.myProfile")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("profile.profileDesc")}
            </p>
          </div>




          {isLocked && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 px-4 py-2 text-cyan-600 dark:text-cyan-300">
              <Lock className="w-4 h-4" />
              {t("profile.baselineLocked")}
            </div>
          )}
        </div>




        {isLocked && (
          <div className="mb-6 rounded-2xl bg-yellow-500/10 border border-yellow-400/20 px-5 py-4 text-yellow-700 dark:text-yellow-200">
            {t("profile.baselineNotice")}
          </div>
        )}




        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <User className="w-6 h-6 text-cyan-500" />
              <h2 className="text-2xl font-semibold">
                {t("profile.personalInformation")}
              </h2>
            </div>




            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.fullName")}
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.enterFullName")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.age")}
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.enterAge")}
                  className={baselineInputClass}
                />
              </div>




              <div className="md:col-span-2">
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.icNumber")}
                </label>
                <input
                  type="text"
                  name="ic"
                  value={form.ic}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.enterIcNumber")}
                  className={baselineInputClass}
                />
              </div>
            </div>
          </div>




          {/* Preferences */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <Coins className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold">
                {t("profile.preferences")}
              </h2>
            </div>




            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {t("profile.language")}{" "}
                {i18n.language === "ms" ? "BM" : "EN"} —{" "}
                {t("profile.useTopLanguageButton")}
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("coin.coinCollection")}
                </label>




                <div className="rounded-xl bg-yellow-500/10 border border-yellow-400/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                        {form.coins}
                      </div>




                      <div className="text-sm text-muted-foreground">
                        {t("coin.coinsEarnedFromEducationVideos")}
                      </div>
                    </div>




                    <Coins className="w-10 h-10 text-yellow-500" />
                  </div>




                  <button
                    type="button"
                    onClick={refreshCoins}
                    disabled={refreshingCoins}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {refreshingCoins
                      ? t("coin.refreshing")
                      : t("coin.refreshCoins")}
                  </button>
                </div>
              </div>
            </div>
          </div>




          {/* Baseline Health Data */}
          <div className="lg:col-span-2 bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <HeartPulse className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold">
                {t("profile.baselineHealthData")}
              </h2>
            </div>




            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.bloodPressureSystolic")}
                </label>
                <input
                  type="number"
                  name="systolicBP"
                  value={form.systolicBP}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.systolicPlaceholder")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.bloodPressureDiastolic")}
                </label>
                <input
                  type="number"
                  name="diastolicBP"
                  value={form.diastolicBP}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.diastolicPlaceholder")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.heartRate")}
                </label>
                <input
                  type="number"
                  name="heartRate"
                  value={form.heartRate}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.heartRatePlaceholder")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.dryWeight")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="dryWeight"
                  value={form.dryWeight}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.dryWeightPlaceholder")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.height")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder={t("profile.heightPlaceholder")}
                  className={baselineInputClass}
                />
              </div>




              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  {t("profile.bmi")}
                </label>
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/20 px-4 py-3 text-cyan-600 dark:text-cyan-300 font-semibold">
                  {bmi || t("profile.autoCalculated")}
                </div>
              </div>
            </div>
          </div>




          {/* Medication */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <Pill className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-semibold">
                {t("profile.currentMedication")}
              </h2>
            </div>




            <textarea
              name="currentMedication"
              value={form.currentMedication}
              onChange={handleChange}
              rows={10}
              placeholder={t("profile.enterCurrentMedication")}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-foreground outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>




        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#02142f] font-semibold px-6 py-3 rounded-xl transition"
          >
            <Save className="w-5 h-5" />
            {saving ? t("profile.saving") : t("profile.saveProfile")}
          </button>
        </div>
      </div>
    </div>
  )
}


export default Profile