import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import VolunteerProfileForm from '@/components/volunteer/VolunteerProfileForm'

export default async function VolunteerProfilePage() {
  const { user } = await requireRole('volunteer')
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name, email, phone, city, state, timezone')
    .eq('id', user.id)
    .single()

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <VolunteerProfileForm
        userId={user.id}
        profile={profile as any}
        volunteer={volunteer as any}
      />
    </div>
  )
}
