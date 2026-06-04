import { requireRole } from '@/lib/utils/auth'

export default async function VolunteerInteractionsPage() {
  const { supabase, user } = await requireRole('volunteer')
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).returns<{ id: string }[]>().single()
  const { data: interactions } = await supabase
    .from('interactions').select('*, matches(programs(name)), scholars(profiles(first_name, last_name))').eq('volunteer_id', volunteer?.id ?? '').order('scheduled_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h1>
      {(!interactions || interactions.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((i: any) => (
            <div key={i.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{i.scholars?.profiles?.first_name} {i.scholars?.profiles?.last_name}</p>
                <p className="text-sm text-gray-500">{i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : '—'} · {i.matches?.programs?.name}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{i.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
