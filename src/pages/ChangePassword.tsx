import { FormEvent, useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

export default function ChangePassword() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (newPassword.length < 8) {
      toast.error(t("changePasswordPage.errors.minimumLength"))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("changePasswordPage.errors.notMatch"))
      return
    }

    if (newPassword === currentPassword) {
      toast.error(t("changePasswordPage.errors.mustBeDifferent"))
      return
    }

    try {
      setSaving(true)

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (sessionError || !user?.email) {
        throw new Error(t("changePasswordPage.errors.sessionExpired"))
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (verifyError) {
        throw new Error(t("changePasswordPage.errors.incorrectCurrent"))
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw new Error(t("changePasswordPage.errors.failed"))

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success(t("changePasswordPage.success"))
    } catch (error: any) {
      toast.error(error?.message || t("changePasswordPage.errors.failed"))
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
          <CardTitle className="text-3xl">{t("changePasswordPage.title")}</CardTitle>
          <CardDescription className="text-base">
            {t("changePasswordPage.description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("changePasswordPage.currentPassword")}</Label>
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
              <Label htmlFor="new-password">{t("changePasswordPage.newPassword")}</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder={t("changePasswordPage.minimumCharacters")}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("changePasswordPage.confirmPassword")}</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl bg-cyan-500 text-white hover:bg-cyan-400">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("changePasswordPage.changing")}
                </>
              ) : (
                t("changePasswordPage.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
