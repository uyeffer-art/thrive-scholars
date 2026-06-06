import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const PROGRAM_TYPE_STYLES: Record<string, string> = {
  mentorship_year: 'bg-blue-50 text-blue-700',
  coffee_chat:     'bg-green-50 text-green-700',
  mock_interview:  'bg-purple-50 text-purple-700',
  resume_review:   'bg-amber-50 text-amber-700',
}

export default async function StaffProgramsPage() {
  await requireStaff()
  const admin = createAdminClient()

  const { data: programs } = await admin
    .from('programs')
    .select('*')
    .order('created_at', { ascending: true })

  // Match counts per program
  const { data: matchCounts } = await admin
    .from('matches')
    .select('program_id, status')

  const countMap: Record<string, { total: number; active: number }> = {}
  ;(matchCounts ?? []).forEach((m: any) => {
    if (!countMap[m.program_id]) countMap[m.program_id] = { total: 0, active: 0 }
    countMap[m.program_id].total++
    if (m.status === 'active') countMap[m.program_id].active++
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
      </div>

      <div className="grid gap-4">
        {(programs ?? []).map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-semibold text-gray-900 text-lg">{p.name}</h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PROGRAM_TYPE_STYLES[p.program_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {p.program_type.replace(/_/g, ' ')}
                  </span>
                  {!p.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                {p.description && (
                  <p className="text-sm text-gray-500 mb-3">{p.description}</p>
                )}

                {/* Matching weights */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {Object.entries(p.matching_weights as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="h-1.5 bg-gray-100 rounded-full mb-1">
                        <div
                          className="h-1.5 bg-blue-400 rounded-full"
                          style={{ width: `${v * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-medium text-gray-700">{(v * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>Timeout: <strong className="text-gray-700">{p.match_timeout_days} days</strong></span>
                  <span>Total matches: <strong className="text-gray-700">{countMap[p.id]?.total ?? 0}</strong></span>
                  <span>Active: <strong className="text-gray-700">{countMap[p.id]?.active ?? 0}</strong></span>
                  {p.start_date && <span>Starts: <strong className="text-gray-700">{new Date(p.start_date).toLocaleDateString()}</strong></span>}
                  {p.end_date && <span>Ends: <strong className="text-gray-700">{new Date(p.end_date).toLocaleDateString()}</strong></span>}
                </div>
              </div>

              <Link
                href={`/programs/${p.id}`}
                className="ml-6 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Edit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
