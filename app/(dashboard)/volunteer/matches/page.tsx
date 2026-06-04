import { requireRole } from '@/lib/utils/auth'

export default async function VolunteerMatchesPage() {
  const { supabase, user } = await requireRole('volunteer')

  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id')
    .eq('profile_id', user.id)
    .returns<{ id: string }[]>()
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      programs (name, program_type),
      scholars (
        college, current_stage, career_interests,
        profiles (first_name, last_name, email)
      )
    `)
    .eq('volunteer_id', volunteer?.id ?? '')
    .in('status', ['approved', 'active', 'completed'])
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Matches</h1>

      {(!matches || matches.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No active matches. You'll receive an email when you're matched with a scholar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {m.scholars?.profiles?.first_name} {m.scholars?.profiles?.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {m.scholars?.current_stage} · {m.scholars?.college}
                  </p>
                  {m.scholars?.career_interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.scholars.career_interests.slice(0, 3).map((ci: string) => (
                        <span key={ci} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {ci}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{m.programs?.name}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
