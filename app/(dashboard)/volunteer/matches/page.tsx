import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AcceptDeclineButtons from '@/components/matches/AcceptDeclineButtons'
import EmptyState from '@/components/ui/EmptyState'
import GettingStarted, { type Step } from '@/components/ui/GettingStarted'
import HowItWorks from '@/components/ui/HowItWorks'

export default async function VolunteerMatchesPage() {
  const { user } = await requireRole('volunteer')
  const admin = createAdminClient()

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('id, cal_booking_url, employer, job_title, available_program_types')
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

  const now = new Date()
  const upcomingSessions = (interactions ?? []).filter((i: any) =>
    i.status === 'scheduled' && new Date(i.scheduled_at) > now
  )
  const unconfirmedSessions = (interactions ?? []).filter((i: any) =>
    i.status === 'scheduled' && new Date(i.scheduled_at) <= now
  )

  // Training progress (required modules for volunteers)
  const { data: requiredModules } = await admin
    .from('training_modules')
    .select('id')
    .eq('audience', 'volunteer')
    .eq('is_active', true)
    .eq('is_required', true)
  const { data: volCompletions } = await admin
    .from('training_completions')
    .select('module_id')
    .eq('profile_id', user.id)
    .eq('status', 'completed')

  const vol0 = volunteer as any
  const reqCount = requiredModules?.length ?? 0
  const compCount = volCompletions?.length ?? 0
  const heldOrScheduled = (interactions ?? []).length > 0
  const activeOrDone = (matches ?? []).filter((m: any) => ['active', 'completed'].includes(m.status))

  const steps: Step[] = [
    { label: 'Complete your profile', description: 'Add your role, employer, and the programs you can support.', done: Boolean(vol0?.employer && vol0?.job_title && (vol0?.available_program_types?.length ?? 0) > 0), href: '/volunteer/profile', cta: 'Edit profile' },
    { label: 'Add your booking link', description: 'Share your Cal.com link so scholars can schedule with you.', done: Boolean(vol0?.cal_booking_url), href: '/volunteer/profile', cta: 'Add link' },
    { label: 'Finish required training', description: 'Short modules to prepare you to mentor effectively.', done: compCount >= reqCount, href: '/volunteer/training', cta: 'Start training' },
    { label: 'Accept your match', description: 'Review your scholar and accept to begin mentoring.', done: activeOrDone.length > 0, href: '/volunteer/matches', cta: 'Review match' },
    { label: 'Hold your first session', description: 'Meet your scholar and mark the session held afterward.', done: heldOrScheduled, href: '/volunteer/interactions', cta: 'View sessions' },
  ]

  const vol = volunteer as any

  return (
    <div className="space-y-8">
      {/* Unconfirmed sessions banner */}
      {unconfirmedSessions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              📋 {unconfirmedSessions.length} session{unconfirmedSessions.length > 1 ? 's' : ''} need{unconfirmedSessions.length === 1 ? 's' : ''} confirmation
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Please confirm whether your recent sessions were held or missed.</p>
          </div>
          <a href="/volunteer/interactions"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap ml-4">
            Confirm now →
          </a>
        </div>
      )}

      {/* Getting started checklist */}
      <GettingStarted title="Getting started as a mentor" steps={steps} />

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
          <EmptyState
            icon="🌟"
            title="Thank you for volunteering!"
            message="We're finding a scholar whose goals align with your experience. You'll get an email as soon as you're matched — then you can accept and start making an impact."
            hint="Make sure your profile and booking link are set up so your scholar can reach you easily."
            ctaLabel="Review my profile"
            ctaHref="/volunteer/profile"
          />
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

      {/* How mentoring works */}
      <HowItWorks
        title="How mentoring at Thrive works"
        steps={[
          { icon: '🤝', title: 'Get matched', text: 'We pair you with a scholar whose goals fit your experience.' },
          { icon: '✅', title: 'Accept', text: 'Review your scholar and accept to begin the relationship.' },
          { icon: '📅', title: 'Meet', text: 'Scholars book time via your link; you connect over video.' },
          { icon: '🌱', title: 'Make an impact', text: 'Share guidance, mark sessions held, and watch them grow.' },
        ]}
      />
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
