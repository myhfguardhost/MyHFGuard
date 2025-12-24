import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { getPatientMedications, savePatientMedications } from "@/lib/api"
import { toast } from "sonner"
import { Pill, Clock, Info, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const Medication = () => {
  const [patientId, setPatientId] = useState<string | undefined>(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("patientId")
        || new URLSearchParams(window.location.search).get("patientid")
        || undefined
      : undefined
  )
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

  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ["patient-medications", patientId],
    queryFn: () => getPatientMedications(patientId),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  })

  const [prefs, setPrefs] = useState({
    beta_blockers: false,
    raas_inhibitors: false,
    mras: false,
    sglt2_inhibitors: false,
    statin: false,
    notify_hour: 9,
  })

  useEffect(() => {
    const p = data?.preferences
    if (p) setPrefs(p)
  }, [data])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!patientId) return { ok: false }
      return savePatientMedications({ patientId, ...prefs })
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["patient-medications", patientId] })
      toast.success("Medication preferences saved")
    },
    onError: (e) => {
      toast.error(e.message || "Failed to save preferences")
    }
  })

  const Item = ({ label, keyName, description }: { label: string; keyName: keyof typeof prefs; description?: string }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-primary" />
          <span className="text-base font-medium text-foreground">{label}</span>
        </div>
        {description && <p className="text-xs text-muted-foreground pl-6">{description}</p>}
      </div>
      <Switch checked={!!(prefs as any)[keyName]} onCheckedChange={(v) => setPrefs((x)=>({ ...x, [keyName]: !!v }))} />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              Medication Checklist
            </CardTitle>
          </div>
          <CardDescription>
            Select the medication classes you are currently taking to receive daily reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              Your medications are grouped by their optimal intake time. You will receive notifications on your mobile device at these times.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Noon Reminder (12:00 PM)</h3>
              </div>
              <div className="bg-card border rounded-xl px-4">
                <Item label="Beta blockers" keyName="beta_blockers" description="Helps manage heart rhythm and blood pressure" />
                <Item label="RAAS inhibitors" keyName="raas_inhibitors" description="ACE inhibitors, ARBs, or ARNIs" />
                <Item label="MRAs" keyName="mras" description="Mineralocorticoid receptor antagonists" />
                <Item label="SGLT2 inhibitors" keyName="sglt2_inhibitors" description="Helps remove excess fluid and sugar" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Night Reminder (10:00 PM)</h3>
              </div>
              <div className="bg-card border rounded-xl px-4">
                <Item label="Statin" keyName="statin" description="Cholesterol-lowering medication" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            size="lg"
            disabled={!patientId || mutation.isPending} 
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Medication
