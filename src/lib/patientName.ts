// One rule for the patient name on every admin page and in the PDF, so the
// same patient is never shown with two different names.
//
// 1. The nickname the patient typed in the app (profiles.full_name).
// 2. The User ID (for example P010), when the patient has no nickname yet.
// 3. first_name + last_name, the placeholder made when the account was
//    created (for example "p User"), only if there is no User ID either.
//
// Pass every record that might hold the name; the first nickname found wins.
type NameSource = {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  assigned_user_id?: string | null
} | null | undefined

export function patientDisplayName(sources: NameSource[], fallback = "Unknown Patient"): string {
  const list = sources.filter(Boolean) as NonNullable<NameSource>[]

  for (const source of list) {
    const nickname = String(source.full_name || "").trim()
    if (nickname) return nickname
  }
  for (const source of list) {
    const userId = String(source.assigned_user_id || "").trim()
    if (userId) return userId.toUpperCase()
  }
  for (const source of list) {
    const placeholder = `${source.first_name || ""} ${source.last_name || ""}`.trim()
    if (placeholder) return placeholder
  }
  for (const source of list) {
    const name = String(source.name || "").trim()
    if (name) return name
  }
  return fallback
}
