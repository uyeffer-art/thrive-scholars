import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AcceptDeclineButtons from '@/components/matches/AcceptDeclineButtons'
import EmptyState from '@/components/ui/EmptyState'

export default async function ScholarMatchesPage() {
  const { user } = await requireRole('scholar')
  const admin = createAdminClient()

  const { data: scholar } = await admin
    .from('scholars')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, status, pm_notes, created_at, timeout_at,
      scholar_accepted_at, volunteer_accepted_at,
      programs (name, program_type),
      volunteers (
        id, employer, job_title, industry, is_star_volunteer,
        undergrad_institution, geographic_preference,
        race_ethnicity, gender, first_gen, cal_booking_url,
        profiles (first_name, last_name)
      )
    `)
    .eq('scholar_id', scholar?.id ?? '')
    .in('status', ['approved', 'active', 'completed', 'declined'])
    .order('created_at', { ascending: false })

  const { data: interactions } = await admin
    .from('interactions')
    .select('id, status, scheduled_at, meeting_url, program_type, duration_minutes')
    .eq('scholar_id', scholar?.id ?? '')
    .in('status', ['scheduled', 'held'])
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const upcomingSessions = (interactions ?? []).filter((i: any) =>
    i.status === 'scheduled' && new Date(i.scheduled_at) > new Date()
  )

  return (
    <div className="space-y-8">
      {/* Upcoming sessions banner */}
      {upcomingSessions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h2 className="font-semibold text-blue-900 mb-3">Upcoming sessions</h2>
          <div className="space-y-2">
            {upcomingSessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 capitalize">
                    {s.program_type?.replace(/_/g, ' ')} · {s.duration_minutes} min
                  </p>
                  <p className="text-xs text-blue-600">
                    {new Date(s.scheduled_at).toLocaleString()}
                  </p>
                </div>
                {s.meeting_url && (
                  <a
                    href={s.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join meeting →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Matches</h1>

        {(!matches || matches.length === 0) ? (
          <EmptyState
            icon="🤝"
            title="Your mentor match is on the way"
            message="Our team is finding a mentor whose background and career path fit your goals. You'll get an email the moment your match is ready to review."
            hint="While you wait, complete your profile and any required training so you're ready to hit the ground running."
            ctaLabel="Complete required training"
            ctaHref="/scholar/training"
          />
        ) : (
          <div className="space-y-4">
            {(matches as any[]).map(m => {
              const vol = m.volunteers
              const needsAcceptance = m.status === 'approved' && !m.scholar_accepted_at

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl border p-6 ${needsAcceptance ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}
                >
                  {needsAcceptance && (
                    <div className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-4 inline-block">
                      Action needed — please accept or decline this match
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {vol?.profiles?.first_name} {vol?.profiles?.last_name}
                      </p>
                      <p className="text-gray-600 mt-0.5">
                        {vol?.job_title} · {vol?.employer}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        {vol?.undergrad_institution && (
                          <span>🎓 {vol.undergrad_institution}</span>
                        )}
                        {vol?.geographic_preference && (
                          <span>📍 {vol.geographic_preference}</span>
                        )}
                        {vol?.first_gen && (
                          <span className="text-blue-600">First-gen</span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">{m.programs?.name}</p>

                      {m.pm_notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{m.pm_notes}"</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={m.status} />
                      {m.volunteer_accepted_at && m.status === 'approved' && (
                        <p className="text-xs text-green-600 mt-1">Volunteer accepted ✓</p>
                      )}
                    </div>
                  </div>

                  {/* Accept/Decline or Book session */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {needsAcceptance ? (
                      <AcceptDeclineButtons matchId={m.id} role="scholar" />
                    ) : m.status === 'active' && vol?.cal_booking_url ? (
                      <a
                        href={vol.cal_booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Book a session →
                      </a>
                    ) : (
                      <div />
                    )}
                    <p className="text-xs text-gray-400">
                      Matched {new Date(m.created_at).toLocaleDateString()}
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
