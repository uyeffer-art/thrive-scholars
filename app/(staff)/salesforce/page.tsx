import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function SalesforceSyncPage() {
  await requireStaff()
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: matches },
    { data: interactions },
    { data: syncLogs },
  ] = await Promise.all([
    admin.from('profiles').select('id, first_name, last_name, email, role, sf_contact_id, updated_at').order('updated_at', { ascending: false }).limit(50),
    admin.from('matches').select('id, status, sf_match_record_id, sf_synced_at, updated_at').order('updated_at', { ascending: false }).limit(50),
    admin.from('interactions').select('id, status, sf_interaction_id, sf_synced_at, updated_at').order('updated_at', { ascending: false }).limit(50),
    admin.from('automation_log').select('*').eq('event_type', 'sf_sync').order('created_at', { ascending: false }).limit(20),
  ])

  const unlinkedProfiles = (profiles ?? []).filter((p: any) => !p.sf_contact_id)
  const unsyncedMatches = (matches ?? []).filter((m: any) => !m.sf_match_record_id && ['active', 'completed'].includes(m.status))
  const unsyncedInteractions = (interactions ?? []).filter((i: any) => !i.sf_interaction_id && i.status === 'held')

  const lastSync = (syncLogs ?? [])[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Salesforce Sync</h1>
        {lastSync && (
          <span className="text-sm text-gray-500">
            Last sync: {new Date((lastSync as any).created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Profiles missing SF Contact ID"
          count={unlinkedProfiles.length}
          color={unlinkedProfiles.length > 0 ? 'amber' : 'green'}
        />
        <SummaryCard
          label="Active/completed matches not in SF"
          count={unsyncedMatches.length}
          color={unsyncedMatches.length > 0 ? 'amber' : 'green'}
        />
        <SummaryCard
          label="Held interactions not in SF"
          count={unsyncedInteractions.length}
          color={unsyncedInteractions.length > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Unlinked profiles */}
      {unlinkedProfiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Profiles missing Salesforce Contact ID
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">SF Contact ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(unlinkedProfiles as any[]).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.first_name} {p.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.email}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Not linked</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unsynced matches */}
      {unsyncedMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Matches not synced to Salesforce
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Match ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(unsyncedMatches as any[]).map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{m.status}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unsynced interactions */}
      {unsyncedInteractions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Held interactions not synced to Salesforce
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Interaction ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(unsyncedInteractions as any[]).map(i => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{i.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{i.status}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(i.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent sync log */}
      {syncLogs && syncLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent sync events
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Time</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Triggered by</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(syncLogs as any[]).map(log => (
                  <tr key={log.id} className={`hover:bg-gray-50 ${!log.success ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                      {log.entity_type} <span className="font-mono text-gray-400">{log.entity_id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.triggered_by}</td>
                    <td className="px-4 py-3">
                      {log.success
                        ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                        : <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Failed</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600">{log.error_message ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unlinkedProfiles.length === 0 && unsyncedMatches.length === 0 && unsyncedInteractions.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-green-600 font-medium">✓ Everything is in sync</p>
          <p className="text-gray-500 text-sm mt-1">No pending Salesforce sync items found.</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: 'green' | 'amber' }) {
  const styles = {
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${styles[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}
