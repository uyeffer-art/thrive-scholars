import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const STAGE_LABELS: Record<string, string> = {
  'pre-college':  'Pre-college',
  'college-1':    'College Y1',
  'college-2':    'College Y2',
  'college-3':    'College Y3',
  'college-4':    'College Y4',
  'post-grad':    'Post-grad',
}

export default async function StaffScholarsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>
}) {
  await requireStaff()
  const params = await searchParams
  const query = params.q?.toLowerCase() ?? ''
  const stageFilter = params.stage ?? ''

  const admin = createAdminClient()

  const { data: scholars } = await admin
    .from('scholars')
    .select(`
      id,
      cohort_year,
      current_stage,
      college,
      career_interests,
      first_gen,
      embedding_updated_at,
      profiles (first_name, last_name, email, city, state)
    `)
    .order('created_at', { ascending: false })

  // Client-side filter (dataset is small enough)
  const filtered = (scholars ?? []).filter((s: any) => {
    const name = `${s.profiles?.first_name} ${s.profiles?.last_name}`.toLowerCase()
    const matchesQuery = !query || name.includes(query) ||
      s.profiles?.email?.toLowerCase().includes(query) ||
      s.college?.toLowerCase().includes(query)
    const matchesStage = !stageFilter || s.current_stage === stageFilter
    return matchesQuery && matchesStage
  })

  const stages = ['pre-college', 'college-1', 'college-2', 'college-3', 'college-4', 'post-grad']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scholars</h1>
        <span className="text-sm text-gray-500">{filtered.length} scholars</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form method="GET" className="flex gap-2 flex-1">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, email, or college…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/scholars"
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              !stageFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          {stages.map(s => (
            <Link
              key={s}
              href={`/scholars?stage=${s}${query ? `&q=${query}` : ''}`}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                stageFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {STAGE_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          {query || stageFilter ? 'No scholars match your filters.' : 'No scholars yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stage</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">College</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Career interests</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cohort</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Embedding</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {s.profiles?.first_name} {s.profiles?.last_name}
                      {s.first_gen && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">1st gen</span>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{s.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {STAGE_LABELS[s.current_stage] ?? s.current_stage ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.college ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.career_interests ?? []).slice(0, 3).map((ci: string) => (
                        <span key={ci} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {ci}
                        </span>
                      ))}
                      {(s.career_interests ?? []).length > 3 && (
                        <span className="text-xs text-gray-400">+{s.career_interests.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.cohort_year}</td>
                  <td className="px-4 py-3">
                    <EmbeddingBadge updatedAt={s.embedding_updated_at} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/scholars/${s.id}`}
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

function EmbeddingBadge({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) {
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No embedding</span>
  }
  const isStale = new Date(updatedAt) < new Date('2001-01-01')
  if (isStale) {
    return <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Stale</span>
  }
  return <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Ready</span>
}
