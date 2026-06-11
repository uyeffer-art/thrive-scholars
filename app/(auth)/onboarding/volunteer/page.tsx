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

const RACE_OPTIONS = [
  'Black / African American',
  'Hispanic / Latino',
  'Asian / Pacific Islander',
  'White / Caucasian',
  'Native American / Alaska Native',
  'Middle Eastern / North African',
  'Multiracial',
  'Prefer not to say',
]


const TOTAL_STEPS = 3

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
    gender: '',
    race_ethnicity: [] as string[],
  })

  function toggleArray(key: 'race_ethnicity' | 'available_program_types' | 'personal_interests', value: string) {
    setForm(f => ({
      ...f,
      [key]: (f[key] as string[]).includes(value)
        ? (f[key] as string[]).filter(x => x !== value)
        : [...(f[key] as string[]), value],
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
      gender: form.gender || null,
      race_ethnicity: form.race_ethnicity.length > 0 ? form.race_ethnicity : null,
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
            <span className="text-sm text-gray-500">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Professional info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                <input type="text" required value={form.employer}
                  onChange={e => setForm(f => ({ ...f, employer: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                <input type="text" required value={form.job_title}
                  onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select required value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Undergrad institution</label>
                <input type="text" value={form.undergrad_institution}
                  onChange={e => setForm(f => ({ ...f, undergrad_institution: e.target.value }))}
                  placeholder="e.g. Spelman College"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City / region</label>
                <input type="text" value={form.geographic_preference}
                  onChange={e => setForm(f => ({ ...f, geographic_preference: e.target.value }))}
                  placeholder="e.g. Atlanta, GA"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="button" onClick={() => setStep(2)}
                disabled={!form.employer || !form.job_title || !form.industry}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                Continue
              </button>
            </>
          )}

          {/* Step 2: Identity */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-500">This information helps us make better matches. All fields are optional.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Prefer not to say</option>
                  <option value="Man">Man</option>
                  <option value="Woman">Woman</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Race / ethnicity</label>
                <div className="flex flex-wrap gap-2">
                  {RACE_OPTIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggleArray('race_ethnicity', r)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        form.race_ethnicity.includes(r) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input id="vol_first_gen" type="checkbox" checked={form.first_gen}
                  onChange={e => setForm(f => ({ ...f, first_gen: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="vol_first_gen" className="text-sm text-gray-700">
                  I was a first-generation college student
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Which programs can you participate in?</label>
                <div className="space-y-2">
                  {(Object.keys(PROGRAM_TYPE_LABELS) as ProgramType[]).map(pt => (
                    <label key={pt} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.available_program_types.includes(pt)}
                        onChange={() => toggleArray('available_program_types', pt)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">{PROGRAM_TYPE_LABELS[pt]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max concurrent mentees</label>
                <select value={form.max_concurrent_matches}
                  onChange={e => setForm(f => ({ ...f, max_concurrent_matches: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cal.com booking link <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="url" value={form.cal_booking_url}
                  onChange={e => setForm(f => ({ ...f, cal_booking_url: e.target.value }))}
                  placeholder="https://cal.com/yourname"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Back
                </button>
                <button type="submit" disabled={saving || form.available_program_types.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
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
