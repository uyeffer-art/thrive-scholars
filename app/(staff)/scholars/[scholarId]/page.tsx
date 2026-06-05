import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ScholarDetailPage({
  params,
}: {
  params: Promise<{ scholarId: string }>
}) {
  await requireStaff()
  const { scholarId } = await params
  const admin = createAdminClient()

  const { data: scholar } = await admin
    .from('scholars')
    .select(`
      *,
      profiles (first_name, last_name, email, phone, city, state, timezone, sf_contact_id)
    `)
    .eq('id', scholarId)
    .single()

  if (!scholar) notFound()

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, status, ai_score, created_at,
      programs (name, program_type),
      volunteers (
        job_title, employer,
        profiles (first_name, last_name)
      )
    `)
    .eq('scholar_id', scholarId)
    .order('created_at', { ascending: false })

  const { data: programs } = await admin
    .from('programs')
    .select('id, name, program_type')
    .eq('is_active', true)

  const p = (scholar as any).profiles

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/scholars" className="hover:text-gray-700">Scholars</Link>
            <span>→</span>
            <span>{p?.first_name} {p?.last_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {p?.first_name} {p?.last_name}
            {(scholar as any).first_gen && (
              <span className="ml-2 text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">1st gen</span>
            )}
          </h1>
          <p className="text-gray-500 mt-0.5">{p?.email}</p>
        </div>

        {/* Run matching button — links to matching UI */}
        <Link
          href={`/scholars/${scholarId}/match`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Run matching →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Profile card */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow label="Stage" value={(scholar as any).current_stage?.replace(/-/g, ' ')} />
            <InfoRow label="Cohort year" value={(scholar as any).cohort_year} />
            <InfoRow label="College" value={(scholar as any).college} />
            <InfoRow label="Grad year" value={(scholar as any).college_grad_year} />
            <InfoRow label="Location" value={[p?.city, p?.state].filter(Boolean).join(', ')} />
            <InfoRow label="Geo preference" value={(scholar as any).geographic_preference} />
            <InfoRow label="Gender" value={(scholar as any).gender} />
            <InfoRow label="Salesforce ID" value={p?.sf_contact_id} />
          </dl>

          {(scholar as any).race_ethnicity?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Race / ethnicity</p>
              <div className="flex flex-wrap gap-1">
                {(scholar as any).race_ethnicity.map((r: string) => (
                  <span key={r} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {(scholar as any).career_interests?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Career interests</p>
              <div className="flex flex-wrap gap-1">
                {(scholar as any).career_interests.map((ci: string) => (
                  <span key={ci} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ci}</span>
                ))}
              </div>
            </div>
          )}

          {(scholar as any).personal_interests?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Personal interests</p>
              <div className="flex flex-wrap gap-1">
                {(scholar as any).personal_interests.map((pi: string) => (
                  <span key={pi} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pi}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Embedding status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Matching</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Embedding status</p>
              <EmbeddingStatus updatedAt={(scholar as any).embedding_updated_at} />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Active programs</p>
              {(programs ?? []).map((prog: any) => (
                <p key={prog.id} className="text-gray-700 text-xs capitalize">
                  · {prog.name}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Match history</h2>
        </div>
        {(!matches || matches.length === 0) ? (
          <div className="p-8 text-center text-gray-500 text-sm">No matches yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Volunteer</th>
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
                      {m.volunteers?.profiles?.first_name} {m.volunteers?.profiles?.last_name}
                    </p>
                    <p className="text-gray-500 text-xs">{m.volunteers?.job_title} · {m.volunteers?.employer}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600 capitalize">
                    {m.programs?.name}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={m.status} />
                  </td>
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

function EmbeddingStatus({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) return <span className="text-gray-400">No embedding — run matching to generate</span>
  const isStale = new Date(updatedAt) < new Date('2001-01-01')
  if (isStale) return <span className="text-amber-600">Stale — will regenerate on next match run</span>
  return <span className="text-green-600">Ready ({new Date(updatedAt).toLocaleDateString()})</span>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    suggested: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-50 text-amber-700',
    approved: 'bg-blue-50 text-blue-700',
    active: 'bg-green-50 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    declined: 'bg-red-50 text-red-700',
    timed_out: 'bg-orange-50 text-orange-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
