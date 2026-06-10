import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VolunteerActionsPanel from '@/components/volunteer/VolunteerActionsPanel'

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  mentorship_year: 'Mentorship Year',
  coffee_chat:     'Coffee Chats',
  mock_interview:  'Mock Interviews',
  resume_review:   'Resume Reviews',
}

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ volunteerId: string }>
}) {
  await requireStaff()
  const { volunteerId } = await params
  const admin = createAdminClient()

  const { data: volunteer } = await admin
    .from('volunteers')
    .select(`
      *,
      profiles (first_name, last_name, email, phone, city, state, sf_contact_id)
    `)
    .eq('id', volunteerId)
    .single()

  if (!volunteer) notFound()

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, status, ai_score, created_at,
      programs (name, program_type),
      scholars (
        college, current_stage,
        profiles (first_name, last_name)
      )
    `)
    .eq('volunteer_id', volunteerId)
    .order('created_at', { ascending: false })

  const { data: interactions } = await admin
    .from('interactions')
    .select('id, status, scheduled_at, held_at, duration_minutes, program_type')
    .eq('volunteer_id', volunteerId)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  const v = volunteer as any
  const p = v.profiles
  const heldCount = (interactions ?? []).filter((i: any) => i.status === 'held').length

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/volunteers" className="hover:text-gray-700">Volunteers</Link>
            <span>→</span>
            <span>{p?.first_name} {p?.last_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {p?.first_name} {p?.last_name}
            {v.is_star_volunteer && <span>⭐</span>}
            {v.is_corporate_partner && (
              <span className="text-sm bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                {v.corporate_partner_name ?? 'Partner'}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-0.5">{p?.email}</p>
        </div>

        <StatusBadge status={v.status} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total matches', value: v.total_matches_completed },
          { label: 'Sessions held', value: heldCount },
          { label: 'Max concurrent', value: v.max_concurrent_matches },
          { label: 'Last active', value: v.last_active_at ? new Date(v.last_active_at).toLocaleDateString() : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Profile */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow label="Job title" value={v.job_title} />
            <InfoRow label="Employer" value={v.employer} />
            <InfoRow label="Industry" value={v.industry} />
            <InfoRow label="Years experience" value={v.years_experience} />
            <InfoRow label="Undergrad" value={v.undergrad_institution} />
            <InfoRow label="Grad school" value={v.grad_institution} />
            <InfoRow label="Location" value={[p?.city, p?.state].filter(Boolean).join(', ')} />
            <InfoRow label="Geo preference" value={v.geographic_preference} />
            <InfoRow label="Gender" value={v.gender} />
            <InfoRow label="First gen" value={v.first_gen ? 'Yes' : 'No'} />
            <InfoRow label="LinkedIn" value={v.linkedin_url} />
            <InfoRow label="Salesforce ID" value={v.sf_volunteer_id} />
          </dl>

          {v.race_ethnicity?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Race / ethnicity</p>
              <div className="flex flex-wrap gap-1">
                {v.race_ethnicity.map((r: string) => (
                  <span key={r} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {v.star_notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800 font-medium mb-1">⭐ Star notes</p>
              <p className="text-sm text-yellow-700">{v.star_notes}</p>
            </div>
          )}
        </div>

        {/* Programs & embedding */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Programs</h2>
            <div className="space-y-1">
              {(v.available_program_types ?? []).map((pt: string) => (
                <p key={pt} className="text-sm text-gray-700">· {PROGRAM_TYPE_LABELS[pt] ?? pt}</p>
              ))}
            </div>
            {v.cal_booking_url && (
              <a
                href={v.cal_booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-xs text-blue-600 hover:underline"
              >
                Cal.com booking link →
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Embedding</h2>
            <EmbeddingStatus updatedAt={v.embedding_updated_at} />
          </div>

          <VolunteerActionsPanel
            volunteerId={v.id}
            currentStatus={v.status}
            isStar={v.is_star_volunteer ?? false}
            starNotes={v.star_notes}
          />
        </div>
      </div>

      {/* Match history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Match history</h2>
        </div>
        {(!matches || matches.length === 0) ? (
          <div className="p-8 text-center text-gray-500 text-sm">No matches yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Scholar</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Program</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">AI Score</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(matches as any[]).map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">
                      {m.scholars?.profiles?.first_name} {m.scholars?.profiles?.last_name}
                    </p>
                    <p className="text-gray-500 text-xs">{m.scholars?.current_stage} · {m.scholars?.college}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{m.programs?.name}</td>
                  <td className="px-6 py-3"><MatchStatusBadge status={m.status} /></td>
                  <td className="px-6 py-3">
                    {m.ai_score ? (
                      <span className={`font-medium ${m.ai_score >= 0.7 ? 'text-green-600' : m.ai_score >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {(m.ai_score * 100).toFixed(0)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent sessions */}
      {interactions && interactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent sessions</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Type</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Scheduled</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Duration</th>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(interactions as any[]).map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700 capitalize">{i.program_type?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-3 text-gray-600 text-xs">
                    {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{i.duration_minutes ? `${i.duration_minutes} min` : '—'}</td>
                  <td className="px-6 py-3"><MatchStatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs">{label}</dt>
      <dd className="text-gray-900 mt-0.5">{value ?? <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:   'bg-green-50 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    paused:   'bg-amber-50 text-amber-700',
    retired:  'bg-red-50 text-red-600',
  }
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function MatchStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    suggested:        'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-50 text-amber-700',
    approved:         'bg-blue-50 text-blue-700',
    active:           'bg-green-50 text-green-700',
    completed:        'bg-gray-100 text-gray-600',
    declined:         'bg-red-50 text-red-700',
    timed_out:        'bg-orange-50 text-orange-700',
    cancelled:        'bg-gray-100 text-gray-500',
    held:             'bg-green-50 text-green-700',
    scheduled:        'bg-blue-50 text-blue-700',
    missed:           'bg-red-50 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function EmbeddingStatus({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) return <p className="text-sm text-gray-400">No embedding yet</p>
  const isStale = new Date(updatedAt) < new Date('2001-01-01')
  if (isStale) return <p className="text-sm text-amber-600">Stale — will refresh on next match run</p>
  return <p className="text-sm text-green-600">Ready<br /><span className="text-xs text-gray-400">{new Date(updatedAt).toLocaleDateString()}</span></p>
}
