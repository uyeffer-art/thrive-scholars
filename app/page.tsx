import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { roleDashboardPath } from '@/lib/utils/auth'
import type { UserRole } from '@/lib/types/database'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .returns<{ role: UserRole }[]>()
    .single()

  if (!profile) redirect('/onboarding/scholar')

  redirect(roleDashboardPath(profile.role))
}
