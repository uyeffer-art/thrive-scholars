import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const AUDIENCE_STYLES: Record<string, string> = {
  scholar:   'bg-blue-50 text-blue-700',
  volunteer: 'bg-green-50 text-green-700',
  staff:     'bg-purple-50 text-purple-700',
  admin:     'bg-gray-100 text-gray-700',
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  video:   '🎬',
  article: '📄',
  pdf:     '📋',
  quiz:    '✅',
}

export default async function StaffTrainingPage() {
  await requireStaff()
  const admin = createAdminClient()

  const { data: modules } = await admin
    .from('training_modules')
    .select('*')
    .order('audience')
    .order('order_index')

  // Completion counts per module
  const { data: completions } = await admin
    .from('training_completions')
    .select('module_id, status')

  const completionMap: Record<string, { total: number; completed: number }> = {}
  ;(completions ?? []).forEach((c: any) => {
    if (!completionMap[c.module_id]) completionMap[c.module_id] = { total: 0, completed: 0 }
    completionMap[c.module_id].total++
    if (c.status === 'completed') completionMap[c.module_id].completed++
  })

  const scholarModules = (modules ?? []).filter((m: any) => m.audience === 'scholar')
  const volunteerModules = (modules ?? []).filter((m: any) => m.audience === 'volunteer')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training</h1>
        <Link
          href="/training/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New module
        </Link>
      </div>

      {[
        { label: 'Scholar modules', modules: scholarModules },
        { label: 'Volunteer modules', modules: volunteerModules },
      ].map(section => (
        <div key={section.label} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {section.label}
          </h2>

          {section.modules.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
              No modules yet. <Link href="/training/new" className="text-blue-600 hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Module</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Audience</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Required</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Completions</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {section.modules.map((m: any) => {
                    const counts = completionMap[m.id]
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{m.title}</p>
                          {m.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{m.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${AUDIENCE_STYLES[m.audience] ?? 'bg-gray-100 text-gray-600'}`}>
                            {m.audience}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CONTENT_TYPE_ICONS[m.content_type] ?? '📎'} {m.content_type ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {m.is_required
                            ? <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Required</span>
                            : <span className="text-xs text-gray-400">Optional</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {counts ? `${counts.completed} / ${counts.total}` : '0'}
                        </td>
                        <td className="px-4 py-3">
                          {m.is_active
                            ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/training/${m.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
