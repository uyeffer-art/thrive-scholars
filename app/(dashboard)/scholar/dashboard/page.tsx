import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function ScholarDashboardPage() {
  const { user } = await requireRole('scholar')
  const admin = createAdminClient()

  const { data: scholar } = await admin
    .from('scholars')
    .select('id, current_stage, college, career_interests')
    .eq('profile_id', user.id)
    .single()

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  const { data: matches } = await admin
    .from('matches')
    .select('id, status, programs(name, program_type), volunteers(job_title, employer, profiles(first_name, last_name))')
    .eq('scholar_id', (scholar as any)?.id ?? '')
    .in('status', ['approved', 'active'])

  const { data: upcomingSessions } = await admin
    .from('interactions')
    .select('id, scheduled_at, duration_minutes, program_type, volunteers(profiles(first_name, last_name))')
    .eq('scholar_id', (scholar as any)?.id ?? '')
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(3)

  const { data: trainingModules } = await admin
    .from('training_modules')
    .select('id')
    .eq('audience', 'scholar')
    .eq('is_active', true)
    .eq('is_required', true)

  const { data: completions } = await admin
    .from('training_completions')
    .select('module_id, status')
    .eq('profile_id', user.id)
    .eq('status', 'completed')

  const requiredCount = trainingModules?.length ?? 0
  const completedCount = completions?.length ?? 0
  const trainingDone = requiredCount > 0 && completedCount >= requiredCount

  const p = profile as any
  const activeMatches = (matches ?? []).filter((m: any) => m.status === 'active')
  const pendingMatches = (matches ?? []).filter((m: any) => m.status === 'approved')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {p?.first_name} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your Thrive journey.</p>
      </div>

      {/* Action needed */}
      {pendingMatches.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              🎉 You have {pendingMatches.length} new match{pendingMatches.length > 1 ? 'es' : ''} waiting for your response!
            </p>
            <p className="text-xs text-blue-700 mt-0.5">Accept or decline to get started.</p>
          </div>
          <Link href="/scholar/matches"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            View matches →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active matches"
          value={activeMatches.length}
          href="/scholar/matches"
          color="blue"
        />
        <StatCard
          label="Upcoming sessions"
          value={upcomingSessions?.length ?? 0}
          href="/scholar/interactions"
          color="green"
        />
        <StatCard
          label="Training complete"
          value={requiredCount > 0 ? `${completedCount}/${requiredCount}` : '—'}
          href="/scholar/training"
          color={trainingDone ? 'green' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active matches */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My mentors</h2>
            <Link href="/scholar/matches" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {activeMatches.length === 0 ? (
            <p className="text-sm text-gray-400">No active matches yet.</p>
          ) : (
            <div className="space-y-3">
              {(activeMatches as any[]).map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                    {m.volunteers?.profiles?.first_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.volunteers?.profiles?.first_name} {m.volunteers?.profiles?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{m.volunteers?.job_title} · {m.volunteers?.employer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming sessions</h2>
            <Link href="/scholar/interactions" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {!upcomingSessions || upcomingSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming sessions.</p>
          ) : (
            <div className="space-y-3">
              {(upcomingSessions as any[]).map(i => (
                <div key={i.id} className="text-sm">
                  <p className="font-medium text-gray-900">
                    {i.program_type?.replace(/_/g, ' ')} with {i.volunteers?.profiles?.first_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(i.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {i.duration_minutes ? ` · ${i.duration_minutes} min` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href, color }: { label: string; value: string | number; href: string; color: 'blue' | 'green' | 'amber' }) {
  const styles = {
    blue:  'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <Link href={href} className={`rounded-xl border p-5 block hover:opacity-90 transition-opacity ${styles[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </Link>
  )
}
