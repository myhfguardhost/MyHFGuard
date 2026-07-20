import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAdminPatientTargetSteps } from "@/lib/api";
import { toast } from "sonner";

export default function PatientTargetStepsControl({
  patientId,
  initialTarget,
  onUpdated,
}: {
  patientId: string;
  initialTarget?: number | null;
  onUpdated?: (target: number) => void;
}) {
  const [target, setTarget] = useState(initialTarget ?? 3000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTarget(initialTarget ?? 3000);
  }, [initialTarget, patientId]);

  const save = async () => {
    const safeTarget = Math.round(Number(target));
    if (!Number.isFinite(safeTarget) || safeTarget < 500 || safeTarget > 50000) {
      toast.error("Target steps must be between 500 and 50,000.");
      return;
    }

    try {
      setSaving(true);
      const result = await updateAdminPatientTargetSteps(patientId, safeTarget);
      setTarget(result.targetSteps);
      onUpdated?.(result.targetSteps);
      toast.success("Daily target steps updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update target steps.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900">Daily Target Steps</CardTitle>
        <p className="text-sm text-slate-500">
          This target is shown in the patient&apos;s app and website exercise page.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="target-steps">Target steps</Label>
            <Input
              id="target-steps"
              type="number"
              min={500}
              max={50000}
              step={100}
              value={target}
              onChange={(event) => setTarget(Number(event.target.value))}
              className="bg-white"
            />
          </div>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {saving ? "Saving..." : "Update Target"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
