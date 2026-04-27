import { Card } from "@/components/ui/card"
import {
  Heart,
  AlertCircle,
  Activity,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Coins,
  CheckCircle,
  Lock,
  PlayCircle,
} from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  rewardUserForVideo,
  hasVideoReward,
  VIDEO_REWARD_COINS,
} from "@/lib/coinService"


type Submodule = {
  titleKey: string
  descriptionKey: string
  contentKey: string
  sourceUrl: string
}


type ModuleType = {
  id: string
  titleKey: string
  descriptionKey: string
  icon: React.ElementType
  color: string
  submodules: Submodule[]
}


type EducationVideo = {
  id: string
  titleKey: string
  descriptionKey: string
  videoUrl: string
}


const educationVideos: EducationVideo[] = [
  {
    id: "heart-failure-basic",
    titleKey: "education.videos.heartFailureBasic.title",
    descriptionKey: "education.videos.heartFailureBasic.description",
    videoUrl: "https://www.youtube.com/embed/9fxm85Fy4sQ",
  },
  {
    id: "low-salt-diet",
    titleKey: "education.videos.lowSaltDiet.title",
    descriptionKey: "education.videos.lowSaltDiet.description",
    videoUrl: "https://www.youtube.com/embed/3gD2aJgNnuk",
  },
  {
    id: "fluid-management",
    titleKey: "education.videos.fluidManagement.title",
    descriptionKey: "education.videos.fluidManagement.description",
    videoUrl: "https://www.youtube.com/embed/qJq5hA4pnOk",
  },
]


const modules: ModuleType[] = [
  {
    id: "A",
    titleKey: "education.modules.A.title",
    descriptionKey: "education.modules.A.description",
    icon: Heart,
    color: "bg-primary/10 text-primary",
    submodules: [
      {
        titleKey: "education.modules.A.submodules.introduction.title",
        descriptionKey: "education.modules.A.submodules.introduction.description",
        contentKey: "education.modules.A.submodules.introduction.content",
        sourceUrl:
          "https://www.heartfailurematters.org/understanding-heart-failure/",
      },
      {
        titleKey: "education.modules.A.submodules.whatIsHF.title",
        descriptionKey: "education.modules.A.submodules.whatIsHF.description",
        contentKey: "education.modules.A.submodules.whatIsHF.content",
        sourceUrl:
          "https://www.heartfailurematters.org/understanding-heart-failure/what-is-heart-failure/",
      },
      {
        titleKey: "education.modules.A.submodules.symptoms.title",
        descriptionKey: "education.modules.A.submodules.symptoms.description",
        contentKey: "education.modules.A.submodules.symptoms.content",
        sourceUrl:
          "https://www.heartfailurematters.org/understanding-heart-failure/what-are-the-symptoms-of-heart-failure/",
      },
      {
        titleKey: "education.modules.A.submodules.normalHeart.title",
        descriptionKey: "education.modules.A.submodules.normalHeart.description",
        contentKey: "education.modules.A.submodules.normalHeart.content",
        sourceUrl:
          "https://www.heartfailurematters.org/understanding-heart-failure/how-does-the-heart-work/",
      },
      {
        titleKey: "education.modules.A.submodules.types.title",
        descriptionKey: "education.modules.A.submodules.types.description",
        contentKey: "education.modules.A.submodules.types.content",
        sourceUrl:
          "https://www.heartfailurematters.org/understanding-heart-failure/what-do-the-different-terms-used-to-describe-heart-failure-mean/",
      },
    ],
  },
  {
    id: "B",
    titleKey: "education.modules.B.title",
    descriptionKey: "education.modules.B.description",
    icon: Activity,
    color: "bg-secondary/10 text-secondary",
    submodules: [
      {
        titleKey: "education.modules.B.submodules.introduction.title",
        descriptionKey: "education.modules.B.submodules.introduction.description",
        contentKey: "education.modules.B.submodules.introduction.content",
        sourceUrl:
          "https://www.heartfailurematters.org/heart-failure-causes-and-other-common-medical-conditions/",
      },
      {
        titleKey: "education.modules.B.submodules.commonHeartConditions.title",
        descriptionKey:
          "education.modules.B.submodules.commonHeartConditions.description",
        contentKey: "education.modules.B.submodules.commonHeartConditions.content",
        sourceUrl:
          "https://www.heartfailurematters.org/heart-failure-causes-and-other-common-medical-conditions/common-heart-conditions-that-may-cause-heart-failure/",
      },
      {
        titleKey: "education.modules.B.submodules.otherMedicalConditions.title",
        descriptionKey:
          "education.modules.B.submodules.otherMedicalConditions.description",
        contentKey:
          "education.modules.B.submodules.otherMedicalConditions.content",
        sourceUrl:
          "https://www.heartfailurematters.org/heart-failure-causes-and-other-common-medical-conditions/other-common-medical-conditions-and-heart-failure/",
      },
    ],
  },
  {
    id: "C",
    titleKey: "education.modules.C.title",
    descriptionKey: "education.modules.C.description",
    icon: BookOpen,
    color: "bg-chart-3/10 text-warning",
    submodules: [
      {
        titleKey: "education.modules.C.submodules.introduction.title",
        descriptionKey: "education.modules.C.submodules.introduction.description",
        contentKey: "education.modules.C.submodules.introduction.content",
        sourceUrl: "https://www.heartfailurematters.org/what-you-can-do/",
      },
      {
        titleKey: "education.modules.C.submodules.bloodPressurePulse.title",
        descriptionKey:
          "education.modules.C.submodules.bloodPressurePulse.description",
        contentKey: "education.modules.C.submodules.bloodPressurePulse.content",
        sourceUrl:
          "https://www.heartfailurematters.org/what-you-can-do/how-to-measure-your-blood-pressure-and-heart-rate/",
      },
      {
        titleKey: "education.modules.C.submodules.lifestyleChanges.title",
        descriptionKey:
          "education.modules.C.submodules.lifestyleChanges.description",
        contentKey: "education.modules.C.submodules.lifestyleChanges.content",
        sourceUrl:
          "https://www.heartfailurematters.org/what-you-can-do/lifestyle-changes/",
      },
      {
        titleKey: "education.modules.C.submodules.managingMedicines.title",
        descriptionKey:
          "education.modules.C.submodules.managingMedicines.description",
        contentKey: "education.modules.C.submodules.managingMedicines.content",
        sourceUrl:
          "https://www.heartfailurematters.org/what-you-can-do/taking-your-medication/",
      },
      {
        titleKey: "education.modules.C.submodules.supportGroups.title",
        descriptionKey:
          "education.modules.C.submodules.supportGroups.description",
        contentKey: "education.modules.C.submodules.supportGroups.content",
        sourceUrl:
          "https://www.heartfailurematters.org/what-you-can-do/finding-support-groups-and-other-useful-organisations/",
      },
    ],
  },
  {
    id: "D",
    titleKey: "education.modules.D.title",
    descriptionKey: "education.modules.D.description",
    icon: Activity,
    color: "bg-chart-2/10 text-secondary",
    submodules: [
      {
        titleKey: "education.modules.D.submodules.introduction.title",
        descriptionKey: "education.modules.D.submodules.introduction.description",
        contentKey: "education.modules.D.submodules.introduction.content",
        sourceUrl:
          "https://www.heartfailurematters.org/living-with-heart-failure/",
      },
      {
        titleKey: "education.modules.D.submodules.travel.title",
        descriptionKey: "education.modules.D.submodules.travel.description",
        contentKey: "education.modules.D.submodules.travel.content",
        sourceUrl:
          "https://www.heartfailurematters.org/living-with-heart-failure/travelling/",
      },
      {
        titleKey: "education.modules.D.submodules.vaccines.title",
        descriptionKey: "education.modules.D.submodules.vaccines.description",
        contentKey: "education.modules.D.submodules.vaccines.content",
        sourceUrl:
          "https://www.heartfailurematters.org/living-with-heart-failure/vaccinations/",
      },
      {
        titleKey: "education.modules.D.submodules.workAdjustments.title",
        descriptionKey:
          "education.modules.D.submodules.workAdjustments.description",
        contentKey: "education.modules.D.submodules.workAdjustments.content",
        sourceUrl:
          "https://www.heartfailurematters.org/living-with-heart-failure/working/",
      },
      {
        titleKey: "education.modules.D.submodules.emotions.title",
        descriptionKey: "education.modules.D.submodules.emotions.description",
        contentKey: "education.modules.D.submodules.emotions.content",
        sourceUrl:
          "https://www.heartfailurematters.org/living-with-heart-failure/your-emotions/",
      },
    ],
  },
  {
    id: "E",
    titleKey: "education.modules.E.title",
    descriptionKey: "education.modules.E.description",
    icon: Users,
    color: "bg-chart-5/10 text-chart-5",
    submodules: [
      {
        titleKey: "education.modules.E.submodules.introduction.title",
        descriptionKey: "education.modules.E.submodules.introduction.description",
        contentKey: "education.modules.E.submodules.introduction.content",
        sourceUrl: "https://www.heartfailurematters.org/for-caregivers/",
      },
      {
        titleKey: "education.modules.E.submodules.howToHelp.title",
        descriptionKey: "education.modules.E.submodules.howToHelp.description",
        contentKey: "education.modules.E.submodules.howToHelp.content",
        sourceUrl:
          "https://www.heartfailurematters.org/for-caregivers/checklist/",
      },
      {
        titleKey: "education.modules.E.submodules.caringStress.title",
        descriptionKey: "education.modules.E.submodules.caringStress.description",
        contentKey: "education.modules.E.submodules.caringStress.content",
        sourceUrl:
          "https://www.heartfailurematters.org/for-caregivers/caring-can-be-hard/",
      },
      {
        titleKey: "education.modules.E.submodules.financialConcerns.title",
        descriptionKey:
          "education.modules.E.submodules.financialConcerns.description",
        contentKey: "education.modules.E.submodules.financialConcerns.content",
        sourceUrl:
          "https://www.heartfailurematters.org/for-caregivers/financial-concerns/",
      },
      {
        titleKey: "education.modules.E.submodules.supportServices.title",
        descriptionKey:
          "education.modules.E.submodules.supportServices.description",
        contentKey: "education.modules.E.submodules.supportServices.content",
        sourceUrl:
          "https://www.heartfailurematters.org/for-caregivers/finding-support/",
      },
    ],
  },
  {
    id: "F",
    titleKey: "education.modules.H.title",
    descriptionKey: "education.modules.H.description",
    icon: AlertCircle,
    color: "bg-accent/10 text-accent",
    submodules: [
      {
        titleKey: "education.modules.H.submodules.introduction.title",
        descriptionKey: "education.modules.H.submodules.introduction.description",
        contentKey: "education.modules.H.submodules.introduction.content",
        sourceUrl: "https://www.heartfailurematters.org/warning-signs/",
      },
      {
        titleKey: "education.modules.H.submodules.shortnessOfBreath.title",
        descriptionKey:
          "education.modules.H.submodules.shortnessOfBreath.description",
        contentKey: "education.modules.H.submodules.shortnessOfBreath.content",
        sourceUrl:
          "https://www.heartfailurematters.org/warning-signs/shortness-of-breath/",
      },
      {
        titleKey: "education.modules.H.submodules.chestPain.title",
        descriptionKey: "education.modules.H.submodules.chestPain.description",
        contentKey: "education.modules.H.submodules.chestPain.content",
        sourceUrl:
          "https://www.heartfailurematters.org/warning-signs/chest-pain/",
      },
      {
        titleKey: "education.modules.H.submodules.rapidWeightGain.title",
        descriptionKey:
          "education.modules.H.submodules.rapidWeightGain.description",
        contentKey: "education.modules.H.submodules.rapidWeightGain.content",
        sourceUrl:
          "https://www.heartfailurematters.org/warning-signs/rapid-weight-gain/",
      },
      {
        titleKey: "education.modules.H.submodules.swellingLegs.title",
        descriptionKey:
          "education.modules.H.submodules.swellingLegs.description",
        contentKey: "education.modules.H.submodules.swellingLegs.content",
        sourceUrl:
          "https://www.heartfailurematters.org/warning-signs/swelling-in-legs-or-ankles/",
      },
    ],
  },
]


type SelectedContent = {
  moduleId: string
  moduleTitle: string
  title: string
  description: string
  content: string
  sourceUrl: string
}


export default function Education() {
  const { t } = useTranslation()


  const [query, setQuery] = React.useState("")
  const [openModule, setOpenModule] = React.useState<string | null>(null)
  const [selectedContent, setSelectedContent] =
    React.useState<SelectedContent | null>(null)


  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(
    null
  )
  const [watchSeconds, setWatchSeconds] = React.useState(0)
  const [rewardedVideos, setRewardedVideos] = React.useState<
    Record<string, boolean>
  >({})
  const [claimingVideoId, setClaimingVideoId] = React.useState<string | null>(
    null
  )
  const [coinMessage, setCoinMessage] = React.useState("")


  const requiredWatchSeconds = 60


  function getVideoSrc(videoUrl: string, shouldPlay: boolean) {
    if (!shouldPlay) return videoUrl


    const separator = videoUrl.includes("?") ? "&" : "?"
    return `${videoUrl}${separator}autoplay=1&mute=1`
  }


  React.useEffect(() => {
    loadRewardStatus()
  }, [])


  React.useEffect(() => {
    if (!selectedVideoId) return


    setWatchSeconds(0)
    setCoinMessage("")


    const timer = window.setInterval(() => {
      setWatchSeconds((prev) => {
        if (prev >= requiredWatchSeconds) {
          window.clearInterval(timer)
          return prev
        }


        return prev + 1
      })
    }, 1000)


    return () => window.clearInterval(timer)
  }, [selectedVideoId])


  React.useEffect(() => {
    if (!selectedVideoId) return
    if (watchSeconds < requiredWatchSeconds) return
    if (rewardedVideos[selectedVideoId]) return
    if (claimingVideoId === selectedVideoId) return


    handleClaimReward(selectedVideoId)
  }, [watchSeconds, selectedVideoId, rewardedVideos, claimingVideoId])


  async function loadRewardStatus() {
    const result: Record<string, boolean> = {}


    for (const video of educationVideos) {
      try {
        result[video.id] = await hasVideoReward(video.id)
      } catch (error) {
        console.error(error)
        result[video.id] = false
      }
    }


    setRewardedVideos(result)
  }


  async function handleClaimReward(videoId: string) {
    try {
      setClaimingVideoId(videoId)
      setCoinMessage("")


      const result = await rewardUserForVideo(videoId)


      if (result.success) {
        setCoinMessage(
          t("education.coinsAdded", {
            coins: VIDEO_REWARD_COINS,
            defaultValue: `${VIDEO_REWARD_COINS} coins added successfully!`,
          })
        )


        setRewardedVideos((prev) => ({
          ...prev,
          [videoId]: true,
        }))
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


  const filtered = modules.filter((m) => {
    const q = query.trim().toLowerCase()
    if (!q) return true


    const moduleTitle = t(m.titleKey).toLowerCase()
    const moduleDescription = t(m.descriptionKey).toLowerCase()


    const matchesModule =
      m.id.toLowerCase().includes(q) ||
      moduleTitle.includes(q) ||
      moduleDescription.includes(q)


    const matchesSubmodule = m.submodules.some((s) => {
      const subTitle = t(s.titleKey).toLowerCase()
      const subDescription = t(s.descriptionKey).toLowerCase()
      const subContent = t(s.contentKey).toLowerCase()


      return (
        subTitle.includes(q) ||
        subDescription.includes(q) ||
        subContent.includes(q)
      )
    })


    return matchesModule || matchesSubmodule
  })


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("education.pageTitle")}
          </h1>


          <p className="text-muted-foreground">
            {t("education.pageDescription")}
          </p>
        </div>


        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("education.searchPlaceholder")}
            aria-label={t("education.searchAria")}
            className="w-full md:w-96 px-4 py-2 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>


        {selectedContent && (
          <Card className="mb-8 p-6 border-primary/20">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  {t("education.moduleLabel")} {selectedContent.moduleId} ·{" "}
                  {selectedContent.moduleTitle}
                </div>


                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {selectedContent.title}
                </h2>


                <p className="text-muted-foreground">
                  {selectedContent.description}
                </p>
              </div>


              <button
                onClick={() => setSelectedContent(null)}
                className="p-2 rounded-md border border-border hover:bg-muted"
                aria-label={t("education.closeContent")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3">
                {t("education.learningContent")}
              </h3>


              <p className="text-sm text-muted-foreground leading-7 whitespace-pre-line">
                {selectedContent.content}
              </p>
            </div>


            <div className="mt-4">
              <a
                href={selectedContent.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                {t("education.viewSource")}
              </a>
            </div>
          </Card>
        )}


        <div className="space-y-6">
          {filtered.map((module) => {
            const Icon = module.icon
            const isOpen = openModule === module.id
            const moduleTitle = t(module.titleKey)
            const moduleDescription = t(module.descriptionKey)


            return (
              <Card key={module.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>


                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        {t("education.moduleLabel")} {module.id}
                      </div>


                      <h3 className="font-bold text-xl text-foreground mb-2">
                        {moduleTitle}
                      </h3>


                      <p className="text-sm text-muted-foreground mb-4">
                        {moduleDescription}
                      </p>


                      <button
                        onClick={() => setOpenModule(isOpen ? null : module.id)}
                        className="px-4 py-2 rounded-md border border-border text-sm font-medium flex items-center gap-2"
                      >
                        {isOpen ? (
                          <>
                            {t("education.hideSubmodules")}
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {t("education.showSubmodules")}
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>


                {isOpen && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {module.submodules.map((sub, index) => {
                      const subTitle = t(sub.titleKey)
                      const subDescription = t(sub.descriptionKey)
                      const subContent = t(sub.contentKey)


                      return (
                        <Card key={index} className="p-4 border border-border">
                          <h4 className="font-semibold text-foreground mb-2">
                            {subTitle}
                          </h4>


                          <p className="text-sm text-muted-foreground mb-4">
                            {subDescription}
                          </p>


                          <button
                            onClick={() =>
                              setSelectedContent({
                                moduleId: module.id,
                                moduleTitle,
                                title: subTitle,
                                description: subDescription,
                                content: subContent,
                                sourceUrl: sub.sourceUrl,
                              })
                            }
                            className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm"
                          >
                            {t("education.readContent")}
                          </button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>


        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>


            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-2">
                {t("education.featuresTitle")}
              </h3>


              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {t("education.features.guides")}
                </li>


                <li className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {t("education.features.structured")}
                </li>


                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  {t("education.features.warning")}
                </li>
              </ul>


              <p className="text-xs text-muted-foreground mt-4">
                {t("education.featuresFooter")}
              </p>
            </div>
          </div>
        </Card>


        <Card className="mt-8 p-6 border-yellow-200 bg-yellow-50/60">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-600" />
            </div>


            <div>
              <h3 className="font-bold text-lg text-foreground mb-1">
                {t("education.videoSectionTitle")}
              </h3>


              <p className="text-sm text-muted-foreground">
                {t("education.videoSectionDescription", {
                  seconds: requiredWatchSeconds,
                  coins: VIDEO_REWARD_COINS,
                })}
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {educationVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden bg-card">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    className="w-full h-full"
                    src={getVideoSrc(
                      video.videoUrl,
                      selectedVideoId === video.id
                    )}
                    title={t(video.titleKey)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>


                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-primary" />
                    {t(video.titleKey)}
                  </h4>


                  <p className="text-sm text-muted-foreground mb-4">
                    {t(video.descriptionKey)}
                  </p>


                  <VideoCoinReward
                    videoId={video.id}
                    selectedVideoId={selectedVideoId}
                    setSelectedVideoId={setSelectedVideoId}
                    watchSeconds={watchSeconds}
                    requiredWatchSeconds={requiredWatchSeconds}
                    rewardedVideos={rewardedVideos}
                    claiming={claimingVideoId === video.id}
                  />
                </div>
              </Card>
            ))}
          </div>


          {coinMessage && (
            <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-700 text-center">
                {coinMessage}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


type VideoCoinRewardProps = {
  videoId: string
  selectedVideoId: string | null
  setSelectedVideoId: (id: string) => void
  watchSeconds: number
  requiredWatchSeconds: number
  rewardedVideos: Record<string, boolean>
  claiming: boolean
}


function VideoCoinReward({
  videoId,
  selectedVideoId,
  setSelectedVideoId,
  watchSeconds,
  requiredWatchSeconds,
  rewardedVideos,
  claiming,
}: VideoCoinRewardProps) {
  const { t } = useTranslation()


  const isSelected = selectedVideoId === videoId
  const isRewarded = rewardedVideos[videoId]


  const progress = isSelected
    ? Math.min((watchSeconds / requiredWatchSeconds) * 100, 100)
    : 0


  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Coins className="w-4 h-4 text-yellow-600" />
        <span>
          {t("education.reward", {
            coins: VIDEO_REWARD_COINS,
          })}
        </span>
      </div>


      {!isSelected && !isRewarded && (
        <button
          onClick={() => setSelectedVideoId(videoId)}
          className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          {t("education.collectPointAndPlay", {
            defaultValue: "Collect Point & Play Video",
          })}
        </button>
      )}


      {isSelected && !isRewarded && (
        <>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("education.watchingProgress")}</span>
            <span>
              {Math.min(watchSeconds, requiredWatchSeconds)} /{" "}
              {requiredWatchSeconds} {t("education.seconds")}
            </span>
          </div>


          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>


          <div className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-yellow-100 text-yellow-800 text-sm font-medium flex items-center justify-center gap-2">
            {claiming ? (
              t("education.addingCoins")
            ) : watchSeconds >= requiredWatchSeconds ? (
              <>
                <Coins className="w-4 h-4" />
                {t("education.addingCoins")}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {t("education.continueWatching")}
              </>
            )}
          </div>
        </>
      )}


      {isRewarded && (
        <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
          <CheckCircle className="w-4 h-4" />
          {t("education.coinsAlreadyClaimed")}
        </div>
      )}
    </div>
  )
}

