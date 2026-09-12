import { Card } from "@/components/ui/card"
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Coins,
  Lock,
  PlayCircle,
} from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  hasVideoReward,
  rewardUserForVideo,
  VIDEO_REWARD_COINS,
} from "@/lib/coinService"

type EducationVideo = {
  id: string
  category: string
  title: string
  source: string
  youtubeId: string
}

type EducationModule = {
  id: string
  title: string
  categories: string[]
}

const educationVideos: EducationVideo[] = [
  { id: "J_sLTDGE70w", category: "Understanding Heart Failure", title: "What is heart failure?", source: "Heart Foundation (Australia)", youtubeId: "J_sLTDGE70w" },
  { id: "FBD7M9GxGCQ", category: "Understanding Heart Failure", title: "How does heart failure make you feel?", source: "Heart Foundation (Australia)", youtubeId: "FBD7M9GxGCQ" },
  { id: "1-BDMXOWMD8", category: "Understanding Heart Failure", title: "Ejection Fraction Measurement and Heart Failure", source: "American Heart Association", youtubeId: "1-BDMXOWMD8" },
  { id: "8O4VExOSXcc", category: "Managing Heart Failure Medicines", title: "Medicines for heart failure", source: "Heart Foundation (Australia)", youtubeId: "8O4VExOSXcc" },
  { id: "WOWLsHldqwM", category: "Managing Heart Failure Medicines", title: "How does aspirin work?", source: "British Heart Foundation", youtubeId: "WOWLsHldqwM" },
  { id: "xIlaQuRaZmk", category: "Managing Heart Failure Medicines", title: "How do ACE inhibitors work?", source: "British Heart Foundation", youtubeId: "xIlaQuRaZmk" },
  { id: "uiYJKvwVhEU", category: "Managing Heart Failure Medicines", title: "How do beta blockers work?", source: "British Heart Foundation", youtubeId: "uiYJKvwVhEU" },
  { id: "qK3HFqk8ubk", category: "Managing Heart Failure Medicines", title: "The Cellular Actions of SGLT2 Inhibitors", source: "American College of Cardiology", youtubeId: "qK3HFqk8ubk" },
  { id: "o6Oi_N5jotg", category: "Managing Heart Failure Medicines", title: "Statins, side effects and what they're used for", source: "British Heart Foundation", youtubeId: "o6Oi_N5jotg" },
  { id: "52eMwhf8UfI", category: "Warning Signs", title: "Heart Failure Warning Signs and Symptoms", source: "American Heart Association", youtubeId: "52eMwhf8UfI" },
  { id: "WPOAhPoLbfA", category: "Warning Signs", title: "What to do when you feel sick", source: "Heart Foundation (Australia)", youtubeId: "WPOAhPoLbfA" },
  { id: "LU5k5zibE_g", category: "Introduction to Self-Care", title: "Things to do to make you feel better", source: "Heart Foundation (Australia)", youtubeId: "LU5k5zibE_g" },
  { id: "uM8yQNZ0x10", category: "Managing Blood Pressure", title: "Why is too much salt bad for you?", source: "British Heart Foundation", youtubeId: "uM8yQNZ0x10" },
  { id: "4YNdp3pRjig", category: "Managing Blood Pressure", title: "Understanding Blood Pressure", source: "British Heart Foundation", youtubeId: "4YNdp3pRjig" },
  { id: "yVFzSmG6ZB0", category: "Managing Blood Pressure", title: "Keep your blood pressure down", source: "Heart Foundation (Australia)", youtubeId: "yVFzSmG6ZB0" },
  { id: "wKCa9g0ob7k", category: "Managing Blood Pressure", title: "How to measure your blood pressure at home", source: "British Heart Foundation", youtubeId: "wKCa9g0ob7k" },
  { id: "sUz-MxgnAxY", category: "Managing Blood Pressure", title: "Foods that lower blood pressure", source: "British Heart Foundation", youtubeId: "sUz-MxgnAxY" },
  { id: "-64U9tUQA0A", category: "Managing Blood Pressure", title: "Food for people with heart failure", source: "Heart Foundation (Australia)", youtubeId: "-64U9tUQA0A" },
  { id: "t1EnYhYDlJA", category: "Managing Blood Pressure", title: "Unpack The Salt", source: "Heart Foundation (Australia)", youtubeId: "t1EnYhYDlJA" },
  { id: "xWmiRNfnJ4E", category: "Managing Diabetes", title: "The Heart–Kidney–Diabetes connection", source: "Heart Foundation (Australia)", youtubeId: "xWmiRNfnJ4E" },
  { id: "oDOVXww7sSE", category: "Managing Diabetes", title: "Understanding Type 2 Diabetes", source: "British Heart Foundation", youtubeId: "oDOVXww7sSE" },
  { id: "gbfAXCuoOSk", category: "Managing Diabetes", title: "Heart failure: Nutrition and diet considerations", source: "Ohio State Medical Center", youtubeId: "gbfAXCuoOSk" },
  { id: "Gzz1J5FhHbU", category: "Managing Diabetes", title: "How to eat well with type 2 diabetes", source: "NHS North East London", youtubeId: "Gzz1J5FhHbU" },
  { id: "hTX0iGAAwWY", category: "Managing Diabetes", title: "What are free sugars?", source: "British Heart Foundation", youtubeId: "hTX0iGAAwWY" },
  { id: "Gb6pI2Grec4", category: "Managing High Cholesterol", title: "Cholesterol and heart disease", source: "Heart Foundation (Australia)", youtubeId: "Gb6pI2Grec4" },
  { id: "UaolDzxn-vE", category: "Managing High Cholesterol", title: "What is cholesterol?", source: "Heart Foundation (Australia)", youtubeId: "UaolDzxn-vE" },
  { id: "ZccHstNhKzU", category: "Managing High Cholesterol", title: "How to manage high cholesterol", source: "Heart Foundation (Australia)", youtubeId: "ZccHstNhKzU" },
  { id: "yAuSs-4hXa4", category: "Managing High Cholesterol", title: "Are eggs good or bad for cholesterol?", source: "British Heart Foundation", youtubeId: "yAuSs-4hXa4" },
  { id: "RnF3j-IvhQc", category: "Managing High Cholesterol", title: "Foods to reduce high cholesterol naturally", source: "British Heart Foundation", youtubeId: "RnF3j-IvhQc" },
  { id: "HPk2vM6CInM", category: "Managing High Cholesterol", title: "What does fat do to your body?", source: "British Heart Foundation", youtubeId: "HPk2vM6CInM" },
  { id: "PCgB2mCFVT0", category: "Managing High Cholesterol", title: "Healthy Cooking Oils", source: "American Heart Association", youtubeId: "PCgB2mCFVT0" },
  { id: "o5aof7UI3yg", category: "Managing High Cholesterol", title: "Why is the Mediterranean diet good for your heart?", source: "British Heart Foundation", youtubeId: "o5aof7UI3yg" },
  { id: "klZwKgXnzSI", category: "Physical Activity and Exercise", title: "Exercise for people with heart failure", source: "Heart Foundation (Australia)", youtubeId: "klZwKgXnzSI" },
  { id: "wWGulLAa0O0", category: "Physical Activity and Exercise", title: "What happens inside your body when you exercise?", source: "British Heart Foundation", youtubeId: "wWGulLAa0O0" },
  { id: "k60x24nN9CM", category: "Physical Activity and Exercise", title: "What is my target heart rate?", source: "British Heart Foundation", youtubeId: "k60x24nN9CM" },
  { id: "-JsuNKbAAkU", category: "Physical Activity and Exercise", title: "Cardiac Rehab at Home - Level 1 Programme", source: "British Heart Foundation", youtubeId: "-JsuNKbAAkU" },
  { id: "fgKHFLe654U", category: "Physical Activity and Exercise", title: "10 resistance band exercises you can do at home", source: "British Heart Foundation", youtubeId: "fgKHFLe654U" },
  { id: "cBRvo0284cg", category: "Emotional Wellbeing", title: "Heart failure: Mental and emotional health", source: "Heart Foundation (Australia)", youtubeId: "cBRvo0284cg" },
  { id: "s0f-TtfrMRk", category: "Emotional Wellbeing", title: "Anxiety with Heart Disease: Symptoms, Support and Next Steps", source: "Heart Foundation (Australia)", youtubeId: "s0f-TtfrMRk" },
  { id: "p-SydwbwpwM", category: "Emotional Wellbeing", title: "Loneliness and Heart Health", source: "Heart Foundation (Australia)", youtubeId: "p-SydwbwpwM" },
  { id: "DsK_gbYSSuo", category: "Emotional Wellbeing", title: "Heart Disease & Mental Health: The Heart–Mind Connection", source: "Heart Foundation (Australia)", youtubeId: "DsK_gbYSSuo" },
]

const videoModules: EducationModule[] = [
  { id: "A", title: "Understanding Heart Failure", categories: ["Understanding Heart Failure"] },
  { id: "B", title: "Managing Heart Failure Medicines", categories: ["Managing Heart Failure Medicines"] },
  {
    id: "C",
    title: "What You Can Do",
    categories: [
      "Introduction to Self-Care",
      "Managing Blood Pressure",
      "Managing Diabetes",
      "Managing High Cholesterol",
    ],
  },
  { id: "D", title: "Warning Signs", categories: ["Warning Signs"] },
  {
    id: "E",
    title: "Living with Heart Failure",
    categories: ["Physical Activity and Exercise", "Emotional Wellbeing"],
  },
]

const bmCategories: Record<string, string> = {
  "Understanding Heart Failure": "Memahami Kegagalan Jantung",
  "Managing Heart Failure Medicines": "Mengurus Ubat Kegagalan Jantung",
  "Warning Signs": "Tanda Amaran",
  "Introduction to Self-Care": "Pengenalan kepada Penjagaan Kendiri",
  "Managing Blood Pressure": "Mengurus Tekanan Darah",
  "Managing Diabetes": "Mengurus Diabetes",
  "Managing High Cholesterol": "Mengurus Kolesterol Tinggi",
  "Physical Activity and Exercise": "Aktiviti Fizikal dan Senaman",
  "Emotional Wellbeing": "Kesejahteraan Emosi",
}

const bmModuleTitles: Record<string, string> = {
  A: "Memahami Kegagalan Jantung",
  B: "Mengurus Ubat Kegagalan Jantung",
  C: "Apa yang Boleh Anda Lakukan",
  D: "Tanda Amaran",
  E: "Hidup dengan Kegagalan Jantung",
}

const bmVideoTitles: Record<string, string> = {
  J_sLTDGE70w: "Apakah kegagalan jantung?",
  FBD7M9GxGCQ: "Bagaimanakah kegagalan jantung membuat anda rasa?",
  "1-BDMXOWMD8": "Pengukuran Pecahan Ejeksi dan Kegagalan Jantung",
  "8O4VExOSXcc": "Ubat untuk kegagalan jantung",
  WOWLsHldqwM: "Bagaimanakah aspirin berfungsi?",
  xIlaQuRaZmk: "Bagaimanakah perencat ACE berfungsi?",
  uiYJKvwVhEU: "Bagaimanakah penyekat beta berfungsi?",
  qK3HFqk8ubk: "Tindakan Selular Perencat SGLT2",
  o6Oi_N5jotg: "Statin, kesan sampingan dan kegunaannya",
  "52eMwhf8UfI": "Tanda dan Gejala Amaran Kegagalan Jantung",
  WPOAhPoLbfA: "Perkara yang perlu dilakukan apabila anda berasa sakit",
  LU5k5zibE_g: "Perkara yang boleh dilakukan untuk berasa lebih baik",
  uM8yQNZ0x10: "Mengapakah pengambilan garam berlebihan tidak baik?",
  "4YNdp3pRjig": "Memahami Tekanan Darah",
  yVFzSmG6ZB0: "Kawal tekanan darah anda",
  wKCa9g0ob7k: "Cara mengukur tekanan darah di rumah",
  "sUz-MxgnAxY": "Makanan yang membantu menurunkan tekanan darah",
  "-64U9tUQA0A": "Makanan untuk pesakit kegagalan jantung",
  t1EnYhYDlJA: "Kenali Kandungan Garam",
  xWmiRNfnJ4E: "Hubungan Jantung–Buah Pinggang–Diabetes",
  oDOVXww7sSE: "Memahami Diabetes Jenis 2",
  gbfAXCuoOSk: "Kegagalan jantung: Pertimbangan pemakanan dan diet",
  Gzz1J5FhHbU: "Cara makan secara sihat dengan diabetes jenis 2",
  hTX0iGAAwWY: "Apakah gula bebas?",
  Gb6pI2Grec4: "Kolesterol dan penyakit jantung",
  "UaolDzxn-vE": "Apakah kolesterol?",
  ZccHstNhKzU: "Cara mengurus kolesterol tinggi",
  "yAuSs-4hXa4": "Adakah telur baik atau buruk untuk kolesterol?",
  "RnF3j-IvhQc": "Makanan untuk mengurangkan kolesterol tinggi secara semula jadi",
  HPk2vM6CInM: "Apakah kesan lemak terhadap tubuh anda?",
  PCgB2mCFVT0: "Minyak Masak Sihat",
  o5aof7UI3yg: "Mengapakah diet Mediterranean baik untuk jantung?",
  klZwKgXnzSI: "Senaman untuk pesakit kegagalan jantung",
  wWGulLAa0O0: "Apakah yang berlaku dalam tubuh semasa bersenam?",
  k60x24nN9CM: "Apakah kadar denyutan jantung sasaran saya?",
  "-JsuNKbAAkU": "Pemulihan Jantung di Rumah - Program Tahap 1",
  fgKHFLe654U: "10 senaman jalur rintangan yang boleh dilakukan di rumah",
  cBRvo0284cg: "Kesihatan mental dan emosi bagi pesakit kegagalan jantung",
  "s0f-TtfrMRk": "Kebimbangan dengan Penyakit Jantung: Gejala, Sokongan dan Langkah Seterusnya",
  "p-SydwbwpwM": "Kesunyian dan Kesihatan Jantung",
  DsK_gbYSSuo: "Penyakit Jantung & Kesihatan Mental: Hubungan Jantung–Minda",
}

export default function Education() {
  const { t, i18n } = useTranslation()
  const isBm = i18n.language === "ms"
  const [query, setQuery] = React.useState("")
  const [openModule, setOpenModule] = React.useState<string | null>("A")
  const [completedVideos, setCompletedVideos] = React.useState<Record<string, boolean>>({})
  const [rewardedVideos, setRewardedVideos] = React.useState<Record<string, boolean>>({})
  const [claimingVideoId, setClaimingVideoId] = React.useState<string | null>(null)
  const [coinMessage, setCoinMessage] = React.useState("")

  React.useEffect(() => {
    async function loadRewardStatus() {
      const result: Record<string, boolean> = {}

      await Promise.all(
        educationVideos.map(async (video) => {
          try {
            result[video.id] = await hasVideoReward(video.id)
          } catch (error) {
            console.error(error)
            result[video.id] = false
          }
        })
      )

      setRewardedVideos(result)
    }

    loadRewardStatus()
  }, [])

  async function handleClaimReward(videoId: string) {
    if (!completedVideos[videoId] || rewardedVideos[videoId]) return

    try {
      setClaimingVideoId(videoId)
      setCoinMessage("")
      const result = await rewardUserForVideo(videoId)

      if (result.success) {
        setRewardedVideos((current) => ({ ...current, [videoId]: true }))
        setCoinMessage(
          t("education.coinsAdded", {
            coins: VIDEO_REWARD_COINS,
            defaultValue: `${VIDEO_REWARD_COINS} coins added successfully!`,
          })
        )
      } else {
        setCoinMessage(result.message)
      }
    } catch (error) {
      console.error(error)
      setCoinMessage(
        t("education.failedAddCoins", {
          defaultValue: "Failed to add coins. Please try again.",
        })
      )
    } finally {
      setClaimingVideoId(null)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredModules = videoModules
    .map((module) => {
      const videos = educationVideos.filter((video) => {
        if (!module.categories.includes(video.category)) return false
        if (!normalizedQuery) return true

        return [
          module.title,
          bmModuleTitles[module.id],
          video.category,
          bmCategories[video.category],
          video.title,
          bmVideoTitles[video.id],
          video.source,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      })

      return { ...module, videos }
    })
    .filter((module) => module.videos.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {t("education.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("education.pageDescription")}
          </p>
        </div>

        <div className="mb-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("education.searchPlaceholder")}
            aria-label={t("education.searchAria")}
            className="w-full rounded-md border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary md:w-96"
          />
        </div>

        <Card className="mb-6 border-yellow-200 bg-yellow-50/60 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-yellow-100 p-3">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">
                {t("education.videoSectionTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("education.videoSectionDescription", {
                  coins: VIDEO_REWARD_COINS,
                })}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {filteredModules.map((module) => {
            const isOpen = normalizedQuery ? true : openModule === module.id

            return (
              <Card key={module.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenModule(isOpen ? null : module.id)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left hover:bg-muted/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {t("education.moduleLabel")} {module.id}
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
                        {isBm ? bmModuleTitles[module.id] : module.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {module.videos.length} {isBm ? "video" : "videos"}
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border p-6">
                    {module.categories.map((category) => {
                      const categoryVideos = module.videos.filter(
                        (video) => video.category === category
                      )
                      if (categoryVideos.length === 0) return null

                      return (
                        <section key={category} className="mb-8 last:mb-0">
                          {module.categories.length > 1 && (
                            <h3 className="mb-4 text-lg font-semibold text-foreground">
                              {isBm ? bmCategories[category] : category}
                            </h3>
                          )}
                          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            {categoryVideos.map((video) => (
                              <Card key={video.id} className="overflow-hidden bg-card">
                                <YouTubeCompletionPlayer
                                  video={video}
                                  onCompleted={() => {
                                    setCompletedVideos((current) => ({
                                      ...current,
                                      [video.id]: true,
                                    }))
                                    setCoinMessage("")
                                  }}
                                />
                                <div className="p-4">
                                  <h4 className="mb-2 flex items-start gap-2 font-semibold text-foreground">
                                    <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                    {isBm ? bmVideoTitles[video.id] : video.title}
                                  </h4>
                                  <p className="mb-4 text-sm text-muted-foreground">
                                    {video.source}
                                  </p>
                                  <VideoCoinReward
                                    videoId={video.id}
                                    completed={Boolean(completedVideos[video.id])}
                                    rewardedVideos={rewardedVideos}
                                    claiming={claimingVideoId === video.id}
                                    onClaim={() => handleClaimReward(video.id)}
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {coinMessage && (
          <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-center text-sm font-medium text-green-700">
              {coinMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

let youtubeApiPromise: Promise<any> | null = null

function loadYouTubeApi() {
  const browserWindow = window as any

  if (browserWindow.YT?.Player) return Promise.resolve(browserWindow.YT)

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReadyHandler = browserWindow.onYouTubeIframeAPIReady

      browserWindow.onYouTubeIframeAPIReady = () => {
        previousReadyHandler?.()
        resolve(browserWindow.YT)
      }

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script")
        script.src = "https://www.youtube.com/iframe_api"
        document.head.appendChild(script)
      }
    })
  }

  return youtubeApiPromise
}

function YouTubeCompletionPlayer({
  video,
  onCompleted,
}: {
  video: EducationVideo
  onCompleted: () => void
}) {
  const playerHostRef = React.useRef<HTMLDivElement | null>(null)
  const playerRef = React.useRef<any>(null)
  const onCompletedRef = React.useRef(onCompleted)

  React.useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  React.useEffect(() => {
    let cancelled = false

    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHostRef.current) return

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: video.youtubeId,
        playerVars: { controls: 1, playsinline: 1, rel: 0 },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === YT.PlayerState.ENDED) {
              onCompletedRef.current()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [video.youtubeId])

  return (
    <div className="aspect-video w-full bg-black">
      <div ref={playerHostRef} className="h-full w-full" aria-label={video.title} />
    </div>
  )
}

function VideoCoinReward({
  videoId,
  completed,
  rewardedVideos,
  claiming,
  onClaim,
}: {
  videoId: string
  completed: boolean
  rewardedVideos: Record<string, boolean>
  claiming: boolean
  onClaim: () => void
}) {
  const { t } = useTranslation()
  const isRewarded = rewardedVideos[videoId]

  return (
    <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Coins className="h-4 w-4 text-yellow-600" />
        <span>{t("education.reward", { coins: VIDEO_REWARD_COINS })}</span>
      </div>

      {!isRewarded && (
        <button
          type="button"
          onClick={onClaim}
          disabled={!completed || claiming}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {completed ? <Coins className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {claiming
            ? t("education.addingCoins")
            : completed
              ? t("education.claimCoins", { coins: VIDEO_REWARD_COINS })
              : t("education.finishVideoToUnlock", {
                  defaultValue: "Finish the video to unlock the reward",
                })}
        </button>
      )}

      {isRewarded && (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700">
          <CheckCircle className="h-4 w-4" />
          {t("education.coinsAlreadyClaimed")}
        </div>
      )}
    </div>
  )
}
