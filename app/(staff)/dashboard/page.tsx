import { requireStaff } from '@/lib/utils/auth'

export default async function StaffDashboardPage() {
  const { supabase } = await requireStaff()

  const [
    { count: pendingMatches },
    { count: activeMatches },
    { count: totalScholars },
    { count: activeVolunteers },
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('scholars').select('*', { count: 'exact', head: true }),
    supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const stats = [
    { label: 'Pending review', value: pendingMatches ?? 0, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active matches', value: activeMatches ?? 0, color: 'text-green-600 bg-green-50' },
    { label: 'Total scholars', value: totalScholars ?? 0, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active volunteers', value: activeVolunteers ?? 0, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/staff/matches?status=pending_approval"
            className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors">
            Review pending matches →
          </a>
          <a href="/staff/volunteers"
            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
            Manage volunteers →
          </a>
          <a href="/staff/programs"
            className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors">
            Program settings →
          </a>
        </div>
      </div>
    </div>
  )
}
