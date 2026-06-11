'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PROGRAM_TYPES = [
  { value: '', label: 'All program types' },
  { value: 'mentorship_year', label: 'Mentorship Year' },
  { value: 'coffee_chat', label: 'Coffee Chat' },
  { value: 'mock_interview', label: 'Mock Interview' },
  { value: 'resume_review', label: 'Resume Review' },
]

const TRIGGER_OPTIONS = [
  { value: 168, label: '7 days before' },
  { value: 48,  label: '48 hours before' },
  { value: 24,  label: '24 hours before' },
  { value: 2,   label: '2 hours before' },
  { value: 1,   label: '1 hour before' },
]

const MERGE_TAGS = [
  '{{scholar_first_name}}', '{{scholar_last_name}}', '{{scholar_stage}}', '{{scholar_career_interests}}',
  '{{volunteer_first_name}}', '{{volunteer_last_name}}', '{{volunteer_title}}', '{{volunteer_employer}}', '{{volunteer_email}}',
  '{{session_date}}', '{{session_time}}', '{{duration_minutes}}', '{{session_type}}',
  '{{meeting_url}}', '{{cal_booking_url}}', '{{prep_content}}',
]

type Props = {
  mode: 'new' | 'edit'
  initial?: {
    id?: string
    title: string
    program_type: string
    audience: string
    trigger_hours_before: number
    subject: string
    body_html: string
    prep_content: string
    is_active: boolean
  }
}

export default function ReminderTemplateForm({ mode, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'email' | 'prep'>('email')

  const [title, setTitle]                   = useState(initial?.title ?? '')
  const [programType, setProgramType]       = useState(initial?.program_type ?? '')
  const [audience, setAudience]             = useState(initial?.audience ?? 'scholar')
  const [triggerHours, setTriggerHours]     = useState(initial?.trigger_hours_before ?? 24)
  const [subject, setSubject]               = useState(initial?.subject ?? '')
  const [bodyHtml, setBodyHtml]             = useState(initial?.body_html ?? '')
  const [prepContent, setPrepContent]       = useState(initial?.prep_content ?? '')
  const [isActive, setIsActive]             = useState(initial?.is_active ?? true)

  function insertTag(tag: string, field: 'body' | 'prep' | 'subject') {
    if (field === 'subject') setSubject(s => s + tag)
    if (field === 'body') setBodyHtml(s => s + tag)
    if (field === 'prep') setPrepContent(s => s + tag)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      title,
      program_type: programType || null,
      audience,
      trigger_hours_before: triggerHours,
      subject,
      body_html: bodyHtml,
      prep_content: prepContent || null,
      is_active: isActive,
    }

    const { error: err } = mode === 'new'
      ? await supabase.from('reminder_templates').insert(payload)
      : await supabase.from('reminder_templates').update(payload).eq('id', initial!.id!)

    if (err) { setError(err.message); setSaving(false); return }
    router.push('/reminders')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this template? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('reminder_templates').delete().eq('id', initial!.id!)
    router.push('/reminders')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Basic settings */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Settings</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Template name</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Coffee Chat — 24h reminder (Scholar)"
            className="w-full rounded-lg px-3 py-2.5 text-sm"
            style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Program type</label>
            <select value={programType} onChange={e => setProgramType(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              {PROGRAM_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="scholar">Scholar only</option>
              <option value="volunteer">Volunteer only</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Send timing</label>
            <select value={triggerHours} onChange={e => setTriggerHours(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input id="is_active" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded" />
          <label htmlFor="is_active" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Active — this template will be sent automatically
          </label>
        </div>
      </div>

      {/* Merge tag reference */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--ts-very-light-blue)', borderColor: 'var(--ts-light-blue)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ts-dark-blue)' }}>Available merge tags — click to copy</p>
        <div className="flex flex-wrap gap-1.5">
          {MERGE_TAGS.map(tag => (
            <button key={tag} type="button"
              onClick={() => navigator.clipboard.writeText(tag)}
              className="text-xs font-mono px-2 py-1 rounded border transition-colors hover:opacity-80"
              style={{ background: 'white', borderColor: 'var(--ts-light-blue)', color: 'var(--ts-blue)' }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Email + Prep tabs */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {(['email', 'prep'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium transition-colors capitalize"
              style={{
                color: activeTab === tab ? 'var(--ts-blue)' : 'var(--muted)',
                borderBottom: activeTab === tab ? '2px solid var(--ts-blue)' : '2px solid transparent',
                background: 'transparent',
              }}>
              {tab === 'email' ? 'Email content' : 'In-app prep card'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Subject line</label>
                <input type="text" required value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Your coffee chat with {{volunteer_first_name}} is tomorrow!"
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Email body <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(HTML — use merge tags freely)</span>
                </label>
                <textarea rows={12} required value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                  placeholder="<p>Hi {{scholar_first_name}},</p>..."
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-mono"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Tip: use <code className="text-xs">{'{{prep_content}}'}</code> in the body to automatically embed the prep card content.
                </p>
              </div>
            </>
          )}

          {activeTab === 'prep' && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Prep card content <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(plain text — shown in-app before the session)</span>
              </label>
              <textarea rows={14} value={prepContent} onChange={e => setPrepContent(e.target.value)}
                placeholder="✅ Research the volunteer's company before the call&#10;✅ Prepare 3–5 questions&#10;&#10;Suggested questions:&#10;• ..."
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{ border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                This content appears as a card in the scholar or volunteer's Sessions page before the meeting. Merge tags work here too.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Link href="/reminders"
            className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
            style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
            Cancel
          </Link>
          {mode === 'edit' && (
            <button type="button" onClick={handleDelete}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#dc3545', background: '#fff5f5', border: '1px solid #fcc' }}>
              Delete template
            </button>
          )}
        </div>
        <button type="submit" disabled={saving || !title || !subject || !bodyHtml}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--ts-blue)' }}>
          {saving ? 'Saving…' : mode === 'new' ? 'Create template' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
