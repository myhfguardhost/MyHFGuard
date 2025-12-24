import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Heart, TrendingUp, Footprints, Smartphone, Camera, Clock, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPatientSummary, getPatientVitals, getPatientInfo, serverUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RecentReadings from "@/components/dashboard/RecentReadings";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import VitalsChart from "@/components/dashboard/VitalsChart";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, isYesterday, isToday, format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();

  const ClockDisplay = memo(() => {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(timer)
    }, [])
    return (
      <div className="text-left md:text-right">
        <p className="text-lg md:text-xl font-medium text-muted-foreground">{format(now, 'd MMM yyyy')}</p>
        <p className="text-3xl md:text-4xl font-bold text-primary">{format(now, 'h:mm a')}</p>
      </div>
    )
  })

  const [patientId, setPatientId] = useState<string | undefined>(
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("patientId") || undefined : undefined
  );
  const [showSyncNotice, setShowSyncNotice] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (patientId) return;
      const { data } = await supabase.auth.getSession();
      const id = data?.session?.user?.id || undefined;
      if (mounted) setPatientId(id);
    }
    init();
    return () => { mounted = false };
  }, [patientId]);

  const { data, isLoading } = useQuery({ queryKey: ["patient-summary", patientId], queryFn: () => getPatientSummary(patientId), refetchOnWindowFocus: false, enabled: !!patientId });
  const infoQuery = useQuery({ queryKey: ["patient-info", patientId], queryFn: () => getPatientInfo(patientId), refetchOnWindowFocus: false, enabled: !!patientId });

  useEffect(() => {
    async function syncIfDefault() {
      if (!patientId) return
      const pr = infoQuery.data?.patient
      const isDefault = !pr || (pr.first_name === "User" && pr.last_name === "Patient")
      if (!isDefault) return
      const { data } = await supabase.auth.getSession()
      const meta: any = data?.session?.user?.user_metadata || {}
      const firstName = meta.firstName
      const lastName = meta.lastName
      const dateOfBirth = meta.dateOfBirth
      if (!firstName && !lastName && !dateOfBirth) return
      try {
        await fetch(`${serverUrl()}/admin/ensure-patient`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, firstName, lastName, dateOfBirth }) })
        infoQuery.refetch()
      } catch (_) { }
    }
    syncIfDefault()
  }, [patientId, infoQuery.data])

  // Keep hourly query for calculating "Last" values correctly (small quick query)
  const vitalsHourlyQuery = useQuery({ queryKey: ["patient-vitals", patientId, "hourly"], queryFn: () => getPatientVitals(patientId, "hourly"), refetchOnWindowFocus: false, enabled: !!patientId });

  const summary = data?.summary || {};
  const hr = summary.heartRate ?? "--";
  const bpS = summary.bpSystolic ?? "--";
  const bpD = summary.bpDiastolic ?? "--";
  const bpP = summary.bpPulse ?? "--";
  const weight = summary.weightKg ?? "--";
  const stepsToday = summary.stepsToday ?? "--";
  const distanceToday = summary.distanceToday ?? "--";

  const vitalsHourly = vitalsHourlyQuery.data?.vitals || {};

  const latestTime = (arr?: Array<{ time: string }>) => {
    if (!arr || arr.length === 0) return undefined;
    let max: Date | undefined;
    for (const item of arr) {
      const t = item?.time;
      if (!t) continue;
      const dt = new Date(t);
      if (!Number.isNaN(dt.getTime())) {
        if (!max || dt.getTime() > max.getTime()) max = dt;
      }
    }
    return max;
  };

  const formatDayFriendly = (dt?: Date, src?: Array<{ time: string }>) => {
    if (!dt) return "--";
    const isDateOnly = !!(src && src.some((x: any) => typeof x?.time === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.time)));
    if (isDateOnly) {
      if (isToday(dt)) return "today";
      if (isYesterday(dt)) return "yesterday";
    }
    return formatDistanceToNow(dt, { addSuffix: true });
  };

  const lastHr = latestTime((vitalsHourly.hr as any));
  const lastBp = latestTime((vitalsHourly.bp as any)); // Using hourly for latest
  const lastWeight = latestTime((vitalsHourly.weight as any));
  const lastSteps = latestTime((vitalsHourly.steps as any));

  const lastAny = [lastHr, lastBp, lastWeight, lastSteps].filter(Boolean).sort((a: any, b: any) => (b as Date).getTime() - (a as Date).getTime())[0] as Date | undefined;
  const lastSyncFromSummary = summary.lastSyncTs ? new Date(summary.lastSyncTs) : undefined;
  const lastSync = lastSyncFromSummary && !Number.isNaN(lastSyncFromSummary.getTime()) ? lastSyncFromSummary : lastAny;
  const lastSyncDisplay = lastSync ? formatDistanceToNow(lastSync, { addSuffix: true }) : (summary.lastSyncTs || "unknown");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back, {infoQuery.data?.patient?.first_name || "Patient"}</h1>
            <p className="text-muted-foreground">Here's your health overview for today</p>
          </div>
          <ClockDisplay />
        </div>

        {showSyncNotice && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <Smartphone className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Sync Required:</strong> Last synced {lastSyncDisplay}. Open the MyHFGuard app to synch your latest data.
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowSyncNotice(false)} className="ml-4">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-8">
          <div className="md:col-span-7 mb-0">
            <UpcomingReminders patientId={patientId} />
          </div>
          <div className="md:col-span-3 flex flex-col gap-4">
            <Button size="lg" className="w-full h-20 text-lg gap-3" onClick={() => navigate(patientId ? `/self-check?patientId=${encodeURIComponent(patientId)}` : "/self-check")}>
              <Plus className="w-6 h-6" />
              Collect Data
            </Button>
            <Button
              size="lg"
              className="w-full h-20 text-lg gap-3 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate("/vitals")}
            >
              <Camera className="w-6 h-6" />
              Capture Blood Pressure
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
          <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Heart Rate</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 md:h-6 md:w-24" />
                ) : (
                  <p className="text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-foreground">{hr} {hr !== "--" && "bpm"}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last: {lastHr ? formatDistanceToNow(lastHr, { addSuffix: true }) : "--"}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Blood Pressure</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-24 md:h-6 md:w-28" />
                ) : (
                  <p className="text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-foreground">{bpS}/{bpD}/{bpP}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last: {lastBp ? formatDistanceToNow(lastBp, { addSuffix: true }) : "--"}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-secondary/10 rounded-full">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weight</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 md:h-6 md:w-24" />
                ) : (
                  <p className="text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-foreground">{weight} {weight !== "--" && "kg"}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last: {formatDayFriendly(lastWeight, vitalsHourly.weight as any)}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-warning/10 rounded-full">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Steps Today</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 md:h-6 md:w-24" />
                ) : (
                  <p className="text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-foreground">{stepsToday} {stepsToday !== "--" && "steps"}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last: {lastSteps ? formatDistanceToNow(lastSteps, { addSuffix: true }) : "--"}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-accent/10 rounded-full">
                <Footprints className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Distance Walked Today</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 md:h-6 md:w-24" />
                ) : (
                  <p className="text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-foreground">{distanceToday} {distanceToday !== "--" && "m"}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last: {lastSteps ? formatDistanceToNow(lastSteps, { addSuffix: true }) : "--"}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-secondary/10 rounded-full">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <VitalsChart patientId={patientId} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
