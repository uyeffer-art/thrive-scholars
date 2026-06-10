import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  console.log('[debug] URL:', url?.slice(0, 30))
  console.log('[debug] KEY:', key?.slice(0, 15))
  return createBrowserClient(url, key)
}
