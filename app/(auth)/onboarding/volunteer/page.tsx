'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProgramType } from '@/lib/types/database'

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  mentorship_year: 'Mentorship Year (long-term)',
  coffee_chat: 'Coffee Chats (30 min)',
  mock_interview: 'Mock Interviews (45 min)',
  resume_review: 'Resume Reviews',
}

const INDUSTRIES = [
  'Finance', 'Consulting', 'Technology', 'Healthcare', 'Law',
  'Education', 'Non-profit', 'Government', 'Media', 'Engineering',
  'Marketing', 'Real Estate', 'Entrepreneurship', 'Science / Research',
]

export default function VolunteerOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    employer: '',
    job_title: '',
    industry: '',
    years_experience: '' as number | '',
    linkedin_url: '',
    undergrad_institution: '',
    grad_institution: '',
    geographic_preference: '',
    cal_booking_url: '',
    available_program_types: [] as ProgramType[],
    max_concurrent_matches: 2,
    first_gen: false,
  })

  function toggleProgramType(pt: ProgramType) {
    setForm(f => ({
      ...f,
      available_program_types: f.available_program_types.includes(pt)
        ? f.available_program_types.filter(x => x !== pt)
        : [...f.available_program_types, pt],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await supabase.from('volunteers').insert({
      profile_id: user.id,
      ...form,
      years_experience: form.years_experience === '' ? null : form.years_experience,
    } as any)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    router.push('/volunteer/matches')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Set up your volunteer profile</h1>
            <span className="text-sm text-gray-500">Step {step} of 2</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                <input
                  type="text"
                  required
                  value={form.employer}
                  onChange={e => setForm(f => ({ ...f, employer: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                <input
                  type="text"
                  required
                  value={form.job_title}
                  onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  required
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Undergrad institution</label>
                <input
                  type="text"
                  value={form.undergrad_institution}
                  onChange={e => setForm(f => ({ ...f, undergrad_institution: e.target.value }))}
                  placeholder="e.g. Spelman College"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City / region</label>
                <input
                  type="text"
                  value={form.geographic_preference}
                  onChange={e => setForm(f => ({ ...f, geographic_preference: e.target.value }))}
                  placeholder="e.g. Atlanta, GA"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="vol_first_gen"
                  type="checkbox"
                  checked={form.first_gen}
                  onChange={e => setForm(f => ({ ...f, first_gen: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="vol_first_gen" className="text-sm text-gray-700">
                  I was a first-generation college student
                </label>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.employer || !form.job_title || !form.industry}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which programs can you participate in?
                </label>
                <div className="space-y-2">
                  {(Object.keys(PROGRAM_TYPE_LABELS) as ProgramType[]).map(pt => (
                    <label key={pt} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.available_program_types.includes(pt)}
                        onChange={() => toggleProgramType(pt)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{PROGRAM_TYPE_LABELS[pt]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max concurrent mentees
                </label>
                <select
                  value={form.max_concurrent_matches}
                  onChange={e => setForm(f => ({ ...f, max_concurrent_matches: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cal.com booking link{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.cal_booking_url}
                  onChange={e => setForm(f => ({ ...f, cal_booking_url: e.target.value }))}
                  placeholder="https://cal.com/yourname"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || form.available_program_types.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  {saving ? 'Saving…' : 'Complete setup'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
