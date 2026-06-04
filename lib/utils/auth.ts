import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types/database'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding/scholar')

  return { user, profile, supabase }
}

export async function requireRole(...roles: UserRole[]) {
  const { user, profile, supabase } = await requireAuth()

  if (!roles.includes(profile.role)) redirect('/unauthorized')

  return { user, profile, supabase }
}

export async function requireStaff() {
  return requireRole('staff', 'admin')
}

export async function getSessionProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export { roleDashboardPath } from '@/lib/utils/roles'
