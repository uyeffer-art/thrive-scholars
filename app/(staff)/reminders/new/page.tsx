import { requireStaff } from '@/lib/utils/auth'
import Link from 'next/link'
import ReminderTemplateForm from '@/components/reminders/ReminderTemplateForm'

export default async function NewReminderTemplatePage() {
  await requireStaff()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--muted)' }}>
        <Link href="/reminders" className="hover:underline" style={{ color: 'var(--ts-blue)' }}>Reminders</Link>
        <span>→</span>
        <span>New template</span>
      </div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>New reminder template</h1>
      <ReminderTemplateForm mode="new" />
    </div>
  )
}
