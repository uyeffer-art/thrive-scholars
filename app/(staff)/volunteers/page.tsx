import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  paused:   'bg-amber-50 text-amber-700',
  retired:  'bg-red-50 text-red-600',
}

export default async function StaffVolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; partner?: string }>
}) {
  await requireStaff()
  const params = await searchParams
  const query = params.q?.toLowerCase() ?? ''
  const statusFilter = params.status ?? ''
  const partnerFilter = params.partner ?? ''

  const admin = createAdminClient()

  const { data: volunteers } = await admin
    .from('volunteers')
    .select(`
      id,
      employer,
      job_title,
      industry,
      status,
      is_corporate_partner,
      corporate_partner_name,
      is_star_volunteer,
      total_matches_completed,
      max_concurrent_matches,
      available_program_types,
      geographic_preference,
      embedding_updated_at,
      last_active_at,
      profiles (first_name, last_name, email, city, state)
    `)
    .order('created_at', { ascending: false })

  // Inactive volunteers: active status but no activity in 60+ days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const inactiveAlert = (volunteers ?? []).filter((v: any) =>
    v.status === 'active' &&
    v.last_active_at &&
    v.last_active_at < sixtyDaysAgo
  )

  const filtered = (volunteers ?? []).filter((v: any) => {
    const name = `${v.profiles?.first_name} ${v.profiles?.last_name}`.toLowerCase()
    const matchesQuery = !query ||
      name.includes(query) ||
      v.profiles?.email?.toLowerCase().includes(query) ||
      v.employer?.toLowerCase().includes(query) ||
      v.industry?.toLowerCase().includes(query)
    const matchesStatus = !statusFilter || v.status === statusFilter
    const matchesPartner = !partnerFilter ||
      (partnerFilter === 'partner' && v.is_corporate_partner) ||
      (partnerFilter === 'star' && v.is_star_volunteer)
    return matchesQuery && matchesStatus && matchesPartner
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
        <span className="text-sm text-gray-500">{filtered.length} volunteers</span>
      </div>

      {/* Inactivity alert */}
      {inactiveAlert.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            ⚠️ {inactiveAlert.length} active volunteer{inactiveAlert.length > 1 ? 's' : ''} haven't engaged in 60+ days
          </p>
          <div className="flex flex-wrap gap-2">
            {inactiveAlert.map((v: any) => (
              <Link key={v.id} href={`/volunteers/${v.id}`}
                className="text-xs bg-white border border-amber-200 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors">
                {v.profiles?.first_name} {v.profiles?.last_name}
                {v.last_active_at && (
                  <span className="text-amber-500 ml-1">
                    · {Math.floor((Date.now() - new Date(v.last_active_at).getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form method="GET" className="flex gap-2 flex-1">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, email, employer, or industry…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {partnerFilter && <input type="hidden" name="partner" value={partnerFilter} />}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {['', 'active', 'inactive', 'paused', 'retired'].map(s => (
            <Link
              key={s || 'all'}
              href={`/volunteers?status=${s}${query ? `&q=${query}` : ''}${partnerFilter ? `&partner=${partnerFilter}` : ''}`}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
          <Link
            href={`/volunteers?partner=partner${query ? `&q=${query}` : ''}`}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              partnerFilter === 'partner' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Corporate partners
          </Link>
          <Link
            href={`/volunteers?partner=star${query ? `&q=${query}` : ''}`}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              partnerFilter === 'star' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ⭐ Stars
          </Link>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          {query || statusFilter || partnerFilter ? 'No volunteers match your filters.' : 'No volunteers yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Role / Employer</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Programs</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Matches</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Embedding</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-900">
                        {v.profiles?.first_name} {v.profiles?.last_name}
                      </p>
                      {v.is_star_volunteer && <span className="text-sm">⭐</span>}
                      {v.is_corporate_partner && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          {v.corporate_partner_name ?? 'Partner'}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{v.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{v.job_title}</p>
                    <p className="text-gray-500 text-xs">{v.employer}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(v.available_program_types ?? []).map((pt: string) => (
                        <span key={pt} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                          {pt.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium">{v.total_matches_completed}</span>
                    <span className="text-gray-400"> / {v.max_concurrent_matches} max</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EmbeddingBadge updatedAt={v.embedding_updated_at} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/volunteers/${v.id}`}
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
  if (!updatedAt) return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No embedding</span>
  const isStale = new Date(updatedAt) < new Date('2001-01-01')
  if (isStale) return <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Stale</span>
  return <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Ready</span>
}
