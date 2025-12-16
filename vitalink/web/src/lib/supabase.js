import { createClient } from '@supabase/supabase-js'

// Match supabaseClient.ts defaults so both entrypoints use the new Supabase
// project if Vite env vars are not injected (e.g., in Render preview).
const FALLBACK_URL = 'https://dwfpaxhlouprzxbxaleo.supabase.co'
const FALLBACK_KEY = 'sb_publishable_nViVrH0M06Mtc1-m4klbVg_UglJXSQI'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY
let supabase
if (url && key) {
  supabase = createClient(url, key)
} else {
  const auth = {
    async getSession() { return { data: { session: null }, error: null } },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
    async signInWithPassword() { return { data: null, error: { message: 'Supabase not configured' } } },
    async signUp() { return { data: null, error: { message: 'Supabase not configured' } } },
    async signOut() { return { error: null } },
  }
  supabase = { auth }
}
export { supabase }