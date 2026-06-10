import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import ScholarProfileForm from '@/components/scholar/ScholarProfileForm'

export default async function ScholarProfilePage() {
  const { user } = await requireRole('scholar')
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name, email, phone, city, state, timezone')
    .eq('id', user.id)
    .single()

  const { data: scholar } = await admin
    .from('scholars')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <ScholarProfileForm
        userId={user.id}
        profile={profile as any}
        scholar={scholar as any}
      />
    </div>
  )
}
