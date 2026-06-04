import { requireRole } from '@/lib/utils/auth'

export default async function ScholarMatchesPage() {
  const { supabase, user } = await requireRole('scholar')

  const { data: scholar } = await supabase
    .from('scholars')
    .select('id')
    .eq('profile_id', user.id)
    .returns<{ id: string }[]>()
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      programs (name, program_type),
      volunteers (
        employer, job_title, industry, is_star_volunteer,
        profiles (first_name, last_name)
      )
    `)
    .eq('scholar_id', scholar?.id ?? '')
    .in('status', ['approved', 'active', 'completed'])
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Matches</h1>

      {(!matches || matches.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No matches yet. Check back soon — your program manager will notify you when a match is ready.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {m.volunteers?.profiles?.first_name} {m.volunteers?.profiles?.last_name}
                    {m.volunteers?.is_star_volunteer && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">⭐ Star</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {m.volunteers?.job_title} · {m.volunteers?.employer}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{m.programs?.name}</p>
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
    declined: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
