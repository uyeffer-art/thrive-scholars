import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const STATUS_TABS = [
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'timed_out', label: 'Timed Out' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default async function StaffMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireStaff()
  const params = await searchParams
  const statusFilter = params.status ?? 'approved'

  const admin = createAdminClient()

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, status, ai_score, manually_selected, pm_notes,
      match_email_sent_at, timeout_at, created_at,
      programs (name, program_type),
      scholars (
        current_stage, career_interests,
        profiles (first_name, last_name, email)
      ),
      volunteers (
        job_title, employer, is_star_volunteer, is_corporate_partner, corporate_partner_name,
        profiles (first_name, last_name)
      )
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get counts for each tab
  const { data: counts } = await admin
    .from('matches')
    .select('status')

  const countMap: Record<string, number> = {}
  ;(counts ?? []).forEach((m: any) => {
    countMap[m.status] = (countMap[m.status] ?? 0) + 1
  })

  // Timed-out matches needing action
  const { data: timedOut } = await admin
    .from('matches')
    .select(`
      id, status, timeout_at, created_at,
      programs (name),
      scholars (profiles (first_name, last_name)),
      volunteers (profiles (first_name, last_name))
    `)
    .eq('status', 'timed_out')
    .order('timeout_at', { ascending: true })

  // Approaching timeout: approved matches where timeout_at is within 24h
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data: approachingTimeout } = await admin
    .from('matches')
    .select(`
      id, timeout_at,
      scholars (profiles (first_name, last_name)),
      volunteers (profiles (first_name, last_name))
    `)
    .eq('status', 'approved')
    .lte('timeout_at', soon)
    .not('timeout_at', 'is', null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
        <span className="text-sm text-gray-500">
          {(matches ?? []).length} shown
        </span>
      </div>

      {/* Timeout alerts */}
      {(timedOut ?? []).length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            ⏰ {timedOut!.length} match{timedOut!.length > 1 ? 'es' : ''} timed out — no response received
          </p>
          <div className="flex flex-wrap gap-2">
            {(timedOut as any[]).map(m => (
              <Link key={m.id} href={`/matches/${m.id}`}
                className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1 rounded-full hover:bg-red-50 transition-colors">
                {m.scholars?.profiles?.first_name} × {m.volunteers?.profiles?.first_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(approachingTimeout ?? []).length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            ⚠️ {approachingTimeout!.length} match{approachingTimeout!.length > 1 ? 'es' : ''} expiring within 24 hours
          </p>
          <div className="flex flex-wrap gap-2">
            {(approachingTimeout as any[]).map(m => (
              <Link key={m.id} href={`/matches/${m.id}`}
                className="text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-50 transition-colors">
                {m.scholars?.profiles?.first_name} × {m.volunteers?.profiles?.first_name}
                {m.timeout_at && (
                  <span className="ml-1 opacity-70">
                    · expires {new Date(m.timeout_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(t => (
          <Link
            key={t.value}
            href={`/matches?status=${t.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === t.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {countMap[t.value] ? (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === t.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {countMap[t.value]}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {(!matches || matches.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No {statusFilter} matches.</p>
          {statusFilter === 'approved' && (
            <p className="text-sm text-gray-400 mt-2">
              Run matching from a <Link href="/scholars" className="text-blue-600 hover:underline">scholar's page</Link> to generate matches.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Scholar</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Volunteer</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Program</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">AI Score</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Timeout</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email sent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(matches as any[]).map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {m.scholars?.profiles?.first_name} {m.scholars?.profiles?.last_name}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">
                      {m.scholars?.current_stage?.replace(/-/g, ' ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {m.volunteers?.profiles?.first_name} {m.volunteers?.profiles?.last_name}
                      {m.volunteers?.is_star_volunteer && <span className="ml-1">⭐</span>}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {m.volunteers?.job_title} · {m.volunteers?.employer}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{m.programs?.name}</p>
                    {m.manually_selected && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.ai_score ? (
                      <span className={`font-medium ${
                        m.ai_score >= 0.7 ? 'text-green-600' :
                        m.ai_score >= 0.5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {(m.ai_score * 100).toFixed(0)}%
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.timeout_at
                      ? <TimeoutIndicator timeoutAt={m.timeout_at} />
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {m.match_email_sent_at ? (
                      <span className="text-green-600">✓ Sent</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/matches/${m.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TimeoutIndicator({ timeoutAt }: { timeoutAt: string }) {
  const daysLeft = Math.ceil(
    (new Date(timeoutAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysLeft < 0) return <span className="text-red-500">Expired</span>
  if (daysLeft <= 2) return <span className="text-amber-600">{daysLeft}d left</span>
  return <span className="text-gray-500">{daysLeft}d left</span>
}
