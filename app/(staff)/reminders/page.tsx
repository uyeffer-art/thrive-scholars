import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const TRIGGER_LABELS: Record<number, string> = {
  1: '1 hour before',
  2: '2 hours before',
  24: '24 hours before',
  48: '48 hours before',
  168: '7 days before',
}

const PROGRAM_LABELS: Record<string, string> = {
  mentorship_year: 'Mentorship Year',
  coffee_chat: 'Coffee Chat',
  mock_interview: 'Mock Interview',
  resume_review: 'Resume Review',
}

export default async function RemindersPage() {
  await requireStaff()
  const admin = createAdminClient()

  const { data: templates } = await admin
    .from('reminder_templates')
    .select('*, profiles(first_name, last_name)')
    .order('program_type', { ascending: true })
    .order('trigger_hours_before', { ascending: false })

  const { data: sendCounts } = await admin
    .from('reminder_sends')
    .select('template_id')

  const countMap: Record<string, number> = {}
  ;(sendCounts ?? []).forEach((s: any) => {
    countMap[s.template_id] = (countMap[s.template_id] ?? 0) + 1
  })

  const active = (templates ?? []).filter((t: any) => t.is_active)
  const inactive = (templates ?? []).filter((t: any) => !t.is_active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Session Reminders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Automated emails sent to scholars and volunteers before their sessions
          </p>
        </div>
        <Link
          href="/reminders/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--ts-blue)' }}
        >
          + New template
        </Link>
      </div>

      {/* How it works banner */}
      <div
        className="rounded-xl p-4 mb-8 flex gap-4 items-start border"
        style={{ background: 'var(--ts-very-light-blue)', borderColor: 'var(--ts-light-blue)' }}
      >
        <span className="text-2xl">⏰</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ts-dark-blue)' }}>
            How reminders work
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ts-blue)' }}>
            A cron job runs every hour, finds upcoming sessions, and sends the right template based on
            program type, audience, and trigger timing. Each reminder is sent only once per session.
            Merge tags like <code className="bg-white/60 px-1 rounded text-xs">{'{{scholar_first_name}}'}</code> are
            replaced with real data at send time.
          </p>
        </div>
      </div>

      {/* Active templates */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
          Active — {active.length} template{active.length !== 1 ? 's' : ''}
        </h2>
        <div className="space-y-3">
          {active.length === 0 && (
            <div
              className="rounded-xl border p-8 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              No active templates yet.{' '}
              <Link href="/reminders/new" style={{ color: 'var(--ts-blue)' }} className="hover:underline font-medium">
                Create your first one →
              </Link>
            </div>
          )}
          {(active as any[]).map(t => (
            <TemplateCard key={t.id} template={t} sendCount={countMap[t.id] ?? 0} />
          ))}
        </div>
      </section>

      {/* Inactive templates */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            Inactive — {inactive.length} template{inactive.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-3 opacity-60">
            {(inactive as any[]).map(t => (
              <TemplateCard key={t.id} template={t} sendCount={countMap[t.id] ?? 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TemplateCard({ template: t, sendCount }: { template: any; sendCount: number }) {
  const TRIGGER_LABELS: Record<number, string> = {
    1: '1h before', 2: '2h before', 24: '24h before', 48: '48h before', 168: '7 days before',
  }
  const AUDIENCE_STYLES: Record<string, string> = {
    scholar: 'bg-blue-50 text-blue-700',
    volunteer: 'bg-purple-50 text-purple-700',
    both: 'bg-green-50 text-green-700',
  }

  return (
    <div
      className="rounded-xl border p-5 flex items-center justify-between gap-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{t.title}</p>
          {!t.is_active && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
          )}
        </div>
        <p className="text-xs truncate mb-2" style={{ color: 'var(--muted)' }}>{t.subject}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--ts-very-light-blue)', color: 'var(--ts-blue)' }}
          >
            {TRIGGER_LABELS[t.trigger_hours_before] ?? `${t.trigger_hours_before}h before`}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${AUDIENCE_STYLES[t.audience]}`}>
            {t.audience}
          </span>
          {t.program_type && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
              {t.program_type.replace(/_/g, ' ')}
            </span>
          )}
          {!t.program_type && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">All programs</span>
          )}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {sendCount} sent
          </span>
        </div>
      </div>
      <Link
        href={`/reminders/${t.id}`}
        className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 whitespace-nowrap"
        style={{ color: 'var(--ts-blue)', borderColor: 'var(--border)' }}
      >
        Edit →
      </Link>
    </div>
  )
}
