import { FormEvent, useState } from "react"
import { KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.")
      return
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from the current password.")
      return
    }

    try {
      setSaving(true)

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (sessionError || !user?.email) {
        throw new Error("Your login session has expired. Please sign in again.")
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (verifyError) {
        throw new Error("Current password is incorrect.")
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully.")
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-4 md:py-8">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
            <KeyRound className="h-6 w-6 text-cyan-600" />
          </div>
          <CardTitle className="text-3xl">Change Password</CardTitle>
          <CardDescription className="text-base">
            Enter your current password before choosing a new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
              <p>Your password is updated securely through Supabase Auth and is never stored in the profile table.</p>
            </div>

            <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl bg-cyan-500 text-white hover:bg-cyan-400">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
