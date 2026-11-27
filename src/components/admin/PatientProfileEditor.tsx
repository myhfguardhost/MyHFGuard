import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminProfileUpdate, updateAdminPatientProfile } from "@/lib/api";

type FieldKey =
  | "fullName"
  | "dateOfBirth"
  | "ic"
  | "systolicBp"
  | "diastolicBp"
  | "heartRate"
  | "dryWeight"
  | "height";

type FormValues = Record<FieldKey, string>;

const NUMBER_RULES: Partial<Record<FieldKey, { label: string; min: number; max: number; integer: boolean }>> = {
  systolicBp: { label: "Systolic BP", min: 60, max: 250, integer: true },
  diastolicBp: { label: "Diastolic BP", min: 30, max: 150, integer: true },
  heartRate: { label: "Heart rate", min: 30, max: 220, integer: true },
  dryWeight: { label: "Dry weight", min: 20, max: 300, integer: false },
  height: { label: "Height", min: 100, max: 250, integer: false },
};

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function valuesFromProfile(profile: Record<string, any> | null | undefined): FormValues {
  const p = profile || {};
  return {
    fullName: text(p.full_name),
    dateOfBirth: text(p.date_of_birth).slice(0, 10),
    ic: text(p.ic),
    systolicBp: text(p.systolic_bp),
    diastolicBp: text(p.diastolic_bp),
    heartRate: text(p.heart_rate),
    dryWeight: text(p.dry_weight),
    height: text(p.height),
  };
}

function malaysiaTodayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
}

function ageFrom(birthIso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthIso)) return null;
  const [by, bm, bd] = birthIso.split("-").map(Number);
  const [ty, tm, td] = malaysiaTodayIso().split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

function checkField(key: FieldKey, raw: string): string | null {
  const value = raw.trim();
  if (key === "fullName") return value.length < 2 || value.length > 100 ? "Nickname must be 2 to 100 characters." : null;
  if (key === "ic") return value.length < 5 || value.length > 30 ? "IC must be 5 to 30 characters." : null;
  if (key === "dateOfBirth") {
    if (!value) return "Choose the date of birth.";
    if (value > malaysiaTodayIso()) return "Date of birth cannot be in the future.";
    const age = ageFrom(value);
    return age === null || age < 1 || age > 120 ? "Age must be between 1 and 120." : null;
  }
  const rule = NUMBER_RULES[key];
  if (!rule) return null;
  const n = Number(value);
  if (!value || !Number.isFinite(n) || n < rule.min || n > rule.max || (rule.integer && !Number.isInteger(n))) {
    return `${rule.label} must be ${rule.integer ? "a whole number " : ""}between ${rule.min} and ${rule.max}.`;
  }
  return null;
}

export default function PatientProfileEditor({
  patientId,
  profile,
  onUpdated,
}: {
  patientId: string;
  profile: Record<string, any> | null | undefined;
  onUpdated?: (profile: Record<string, any>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() => valuesFromProfile(profile));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesFromProfile(profile));
      setErrors({});
    }
  }, [open, profile]);

  const original = valuesFromProfile(profile);
  const changedKeys = (Object.keys(values) as FieldKey[]).filter(
    (key) => values[key].trim() !== original[key].trim()
  );
  const age = ageFrom(values.dateOfBirth);

  const setField = (key: FieldKey, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = async () => {
    if (!changedKeys.length) {
      toast.info("Nothing was changed.");
      return;
    }

    // Only the fields the admin changed are checked and sent, so an old value
    // that is outside today's limits does not block other corrections.
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const key of changedKeys) {
      const problem = checkField(key, values[key]);
      if (problem) nextErrors[key] = problem;
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0] as string);
      return;
    }

    const changes: AdminProfileUpdate = {};
    for (const key of changedKeys) {
      const value = values[key].trim();
      if (key === "fullName" || key === "dateOfBirth" || key === "ic") changes[key] = value;
      else changes[key] = Number(value);
    }

    try {
      setSaving(true);
      const result = await updateAdminPatientProfile(patientId, changes);
      onUpdated?.(result.profile);
      toast.success("Patient profile updated.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update the patient profile.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: FieldKey, label: string, props: Record<string, any> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`profile-${key}`}>{label}</Label>
      <Input
        id={`profile-${key}`}
        value={values[key]}
        onChange={(event) => setField(key, event.target.value)}
        aria-invalid={Boolean(errors[key])}
        className={errors[key] ? "border-red-500 bg-white focus-visible:ring-red-500" : "bg-white"}
        {...props}
      />
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={!profile}
        title={profile ? undefined : "This patient has not submitted a profile yet."}
        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit Profile
      </Button>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
            <DialogDescription>
              The patient cannot change these after submitting. Only admin can correct them here.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("fullName", "Nickname", { maxLength: 100 })}</div>
            <div>
              {field("dateOfBirth", "Date of birth", { type: "date", max: malaysiaTodayIso() })}
              {age !== null && !errors.dateOfBirth && (
                <p className="mt-1 text-xs text-slate-500">Age: {age}</p>
              )}
            </div>
            {field("ic", "IC", { maxLength: 30 })}
            {field("systolicBp", "Systolic BP (mmHg)", { type: "number", inputMode: "numeric", min: 60, max: 250 })}
            {field("diastolicBp", "Diastolic BP (mmHg)", { type: "number", inputMode: "numeric", min: 30, max: 150 })}
            {field("heartRate", "Heart rate (bpm)", { type: "number", inputMode: "numeric", min: 30, max: 220 })}
            {field("dryWeight", "Dry weight (kg)", { type: "number", inputMode: "decimal", step: "0.1", min: 20, max: 300 })}
            {field("height", "Height (cm)", { type: "number", inputMode: "decimal", step: "0.1", min: 100, max: 250 })}
          </div>

          <p className="text-xs text-slate-500">Age and BMI are worked out automatically when you save.</p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
