import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AcceptDeclineButtons from '@/components/matches/AcceptDeclineButtons'

export default async function VolunteerMatchesPage() {
  const { user } = await requireRole('volunteer')
  const admin = createAdminClient()

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('id, cal_booking_url')
    .eq('profile_id', user.id)
    .single()

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, status, pm_notes, created_at, timeout_at,
      scholar_accepted_at, volunteer_accepted_at,
      programs (name, program_type),
      scholars (
        id, college, current_stage, career_interests,
        race_ethnicity, gender, first_gen, geographic_preference,
        profiles (first_name, last_name, email)
      )
    `)
    .eq('volunteer_id', volunteer?.id ?? '')
    .in('status', ['approved', 'active', 'completed', 'declined'])
    .order('created_at', { ascending: false })

  const { data: interactions } = await admin
    .from('interactions')
    .select('id, status, scheduled_at, meeting_url, program_type, duration_minutes, scholar_id')
    .eq('volunteer_id', volunteer?.id ?? '')
    .in('status', ['scheduled', 'held'])
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const upcomingSessions = (interactions ?? []).filter((i: any) =>
    i.status === 'scheduled' && new Date(i.scheduled_at) > new Date()
  )

  const vol = volunteer as any

  return (
    <div className="space-y-8">
      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h2 className="font-semibold text-green-900 mb-3">Upcoming sessions</h2>
          <div className="space-y-2">
            {upcomingSessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 capitalize">
                    {s.program_type?.replace(/_/g, ' ')} · {s.duration_minutes} min
                  </p>
                  <p className="text-xs text-green-600">
                    {new Date(s.scheduled_at).toLocaleString()}
                  </p>
                </div>
                {s.meeting_url && (
                  <a
                    href={s.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Join meeting →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cal.com link reminder */}
      {!vol?.cal_booking_url && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            Add your Cal.com booking link so scholars can schedule sessions with you.
          </p>
          <a href="/volunteer/profile" className="text-sm font-medium text-amber-700 hover:underline whitespace-nowrap ml-4">
            Update profile →
          </a>
        </div>
      )}

      {/* Matches */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Matches</h1>

        {(!matches || matches.length === 0) ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No active matches yet.</p>
            <p className="text-sm text-gray-400 mt-1">You'll receive an email when you're matched with a scholar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(matches as any[]).map(m => {
              const s = m.scholars
              const needsAcceptance = m.status === 'approved' && !m.volunteer_accepted_at

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl border p-6 ${needsAcceptance ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}
                >
                  {needsAcceptance && (
                    <div className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-4 inline-block">
                      Action needed — please accept or decline this match
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {s?.profiles?.first_name} {s?.profiles?.last_name}
                      </p>
                      <p className="text-gray-600 mt-0.5 capitalize">
                        {s?.current_stage?.replace(/-/g, ' ')} · {s?.college}
                      </p>

                      {s?.career_interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.career_interests.slice(0, 4).map((ci: string) => (
                            <span key={ci} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              {ci}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {s?.geographic_preference && <span>📍 {s.geographic_preference}</span>}
                        {s?.first_gen && <span className="text-blue-600">First-gen</span>}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">{m.programs?.name}</p>

                      {m.pm_notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{m.pm_notes}"</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={m.status} />
                      {m.scholar_accepted_at && m.status === 'approved' && (
                        <p className="text-xs text-green-600 mt-1">Scholar accepted ✓</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {needsAcceptance ? (
                      <AcceptDeclineButtons matchId={m.id} role="volunteer" />
                    ) : (
                      <div />
                    )}
                    <p className="text-xs text-gray-400">
                      Matched {new Date(m.created_at).toLocaleDateString()}
                      {m.timeout_at && m.status === 'approved' && (
                        <span className="ml-2 text-amber-500">
                          · Expires {new Date(m.timeout_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-blue-100 text-blue-800',
    active:   'bg-green-100 text-green-800',
    completed:'bg-gray-100 text-gray-700',
    declined: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
