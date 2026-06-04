import { requireStaff } from '@/lib/utils/auth'
import Link from 'next/link'

export default async function StaffMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { supabase } = await requireStaff()
  const params = await searchParams
  const statusFilter = params.status ?? 'pending_approval'

  const { data: matches } = await supabase
    .from('v_active_matches')
    .select('*')
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusTabs = [
    { value: 'suggested', label: 'Suggested' },
    { value: 'pending_approval', label: 'Pending review' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Matches</h1>

      <div className="flex gap-2 mb-6">
        {statusTabs.map(t => (
          <Link
            key={t.value}
            href={`/staff/matches?status=${t.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === t.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {(!matches || matches.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No matches with status "{statusFilter}".</p>
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map((m: any) => (
                <tr key={m.match_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.scholar_name}</p>
                    <p className="text-gray-500 text-xs">{m.current_stage}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {m.volunteer_name}
                      {m.is_star_volunteer && <span className="ml-1 text-yellow-500">⭐</span>}
                    </p>
                    <p className="text-gray-500 text-xs">{m.job_title} · {m.employer}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.program_name}</td>
                  <td className="px-4 py-3">
                    {m.ai_score ? (
                      <span className={`font-medium ${m.ai_score >= 0.7 ? 'text-green-600' : m.ai_score >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {(m.ai_score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.timeout_at ? new Date(m.timeout_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/staff/matches/${m.match_id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Review →
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
