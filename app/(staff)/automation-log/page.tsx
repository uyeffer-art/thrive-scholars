import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const EVENT_STYLES: Record<string, string> = {
  match_email_sent:    'bg-blue-50 text-blue-700',
  nudge_sent:          'bg-yellow-50 text-yellow-700',
  sf_sync:             'bg-purple-50 text-purple-700',
  timeout_triggered:   'bg-orange-50 text-orange-700',
  cal_webhook:         'bg-green-50 text-green-700',
  make_webhook:        'bg-teal-50 text-teal-700',
}

export default async function AutomationLogPage({
  searchParams,
}: {
  searchParams: { event?: string; entity?: string }
}) {
  await requireStaff()
  const admin = createAdminClient()

  let query = admin
    .from('automation_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.event) query = query.eq('event_type', searchParams.event)
  if (searchParams.entity) query = query.eq('entity_type', searchParams.entity)

  const { data: logs } = await query

  // Unique event types for filter
  const { data: eventTypes } = await admin
    .from('automation_log')
    .select('event_type')

  const uniqueEvents = [...new Set((eventTypes ?? []).map((e: any) => e.event_type))].sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automation Log</h1>
        <span className="text-sm text-gray-500">Last 100 events</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <a href="/automation-log"
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${!searchParams.event ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          All events
        </a>
        {uniqueEvents.map(event => (
          <a key={event} href={`/automation-log?event=${event}`}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${searchParams.event === event ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {event.replace(/_/g, ' ')}
          </a>
        ))}
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          No automation events logged yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Time</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Event</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Entity</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Triggered by</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logs as any[]).map(log => (
                <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${!log.success ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_STYLES[log.event_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.entity_type && (
                      <span className="capitalize">{log.entity_type}</span>
                    )}
                    {log.entity_id && (
                      <span className="text-gray-400 ml-1 text-xs font-mono">
                        {log.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.triggered_by ?? '—'}</td>
                  <td className="px-4 py-3">
                    {log.success
                      ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                      : <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Failed</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                    {log.error_message
                      ? <span className="text-red-600">{log.error_message}</span>
                      : log.payload
                        ? <span className="font-mono truncate block">{JSON.stringify(log.payload).slice(0, 60)}…</span>
                        : '—'}
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
