import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roleDashboardPath } from '@/lib/utils/auth'
import type { UserRole } from '@/lib/types/database'

// Handles Supabase magic link / OAuth callback
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (next) return NextResponse.redirect(`${origin}${next}`)

        if (profile) {
          const role = (profile as { role: UserRole }).role
          return NextResponse.redirect(
            `${origin}${roleDashboardPath(role)}`,
          )
        }
      }

      return NextResponse.redirect(`${origin}/onboarding/scholar`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
