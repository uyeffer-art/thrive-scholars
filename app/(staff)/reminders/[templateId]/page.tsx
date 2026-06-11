import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ReminderTemplateForm from '@/components/reminders/ReminderTemplateForm'
import { notFound } from 'next/navigation'

export default async function EditReminderTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  await requireStaff()
  const { templateId } = await params
  const admin = createAdminClient()

  const { data: template } = await admin
    .from('reminder_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) notFound()

  const { data: sends } = await admin
    .from('reminder_sends')
    .select('id, sent_at, status, recipient_profile_id, profiles(first_name, last_name)')
    .eq('template_id', templateId)
    .order('sent_at', { ascending: false })
    .limit(20)

  const t = template as any

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--muted)' }}>
        <Link href="/reminders" className="hover:underline" style={{ color: 'var(--ts-blue)' }}>Reminders</Link>
        <span>→</span>
        <span>{t.title}</span>
      </div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>Edit template</h1>

      <ReminderTemplateForm
        mode="edit"
        initial={{
          id: t.id,
          title: t.title,
          program_type: t.program_type ?? '',
          audience: t.audience,
          trigger_hours_before: t.trigger_hours_before,
          subject: t.subject,
          body_html: t.body_html,
          prep_content: t.prep_content ?? '',
          is_active: t.is_active,
        }}
      />

      {/* Send history */}
      {sends && sends.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Recent sends ({sends.length})
          </h2>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <table className="w-full text-sm">
              <thead className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>Recipient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sent at</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {(sends as any[]).map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                      {s.profiles?.first_name} {s.profiles?.last_name}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(s.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === 'sent'
                        ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Sent</span>
                        : <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
