import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import MarkInteractionForm from '@/components/interactions/MarkInteractionForm'
import SendConfirmationButton from '@/components/interactions/SendConfirmationButton'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  held:       'bg-green-50 text-green-700',
  missed:     'bg-red-50 text-red-700',
  cancelled:  'bg-gray-100 text-gray-500',
}

const TYPE_LABELS: Record<string, string> = {
  mentorship_year: 'Mentorship',
  coffee_chat:     'Coffee Chat',
  mock_interview:  'Mock Interview',
  resume_review:   'Resume Review',
}

export default async function StaffInteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireStaff()
  const { status: statusFilter } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('interactions')
    .select(`
      id, status, scheduled_at, held_at, duration_minutes, program_type,
      cal_booking_uid, meeting_url, scholar_rating, volunteer_rating,
      scholars (profiles (first_name, last_name)),
      volunteers (profiles (first_name, last_name))
    `)
    .order('scheduled_at', { ascending: false })
    .limit(100)

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: interactions } = await query
  const nowIso = new Date().toISOString()

  const counts = {
    scheduled: (interactions ?? []).filter((i: any) => i.status === 'scheduled').length,
    held:      (interactions ?? []).filter((i: any) => i.status === 'held').length,
    missed:    (interactions ?? []).filter((i: any) => i.status === 'missed').length,
    cancelled: (interactions ?? []).filter((i: any) => i.status === 'cancelled').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
        <span className="text-sm text-gray-500">Last 100</span>
      </div>

      {/* Status filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: `Scheduled (${counts.scheduled})`, value: 'scheduled' },
          { label: `Held (${counts.held})`, value: 'held' },
          { label: `Missed (${counts.missed})`, value: 'missed' },
          { label: `Cancelled (${counts.cancelled})`, value: 'cancelled' },
        ].map(f => (
          <a key={f.value} href={f.value ? `/interactions?status=${f.value}` : '/interactions'}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              (statusFilter ?? '') === f.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            {f.label}
          </a>
        ))}
      </div>

      {(!interactions || interactions.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          No interactions found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Scholar</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Volunteer</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Scheduled</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Ratings</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(interactions as any[]).map(i => (
                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {i.scholars?.profiles?.first_name} {i.scholars?.profiles?.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {i.volunteers?.profiles?.first_name} {i.volunteers?.profiles?.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {TYPE_LABELS[i.program_type] ?? i.program_type}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {i.scheduled_at
                      ? new Date(i.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[i.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {i.scholar_rating || i.volunteer_rating
                      ? `S:${i.scholar_rating ?? '—'} / V:${i.volunteer_rating ?? '—'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {i.status === 'scheduled' && (
                        <MarkInteractionForm interactionId={i.id} />
                      )}
                      {i.status === 'scheduled' && i.scheduled_at < nowIso && (
                        <SendConfirmationButton interactionId={i.id} />
                      )}
                    </div>
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
