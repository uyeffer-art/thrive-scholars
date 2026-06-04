'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CAREER_OPTIONS = [
  'Finance', 'Consulting', 'Technology', 'Healthcare', 'Law',
  'Education', 'Non-profit', 'Government', 'Media', 'Engineering',
  'Marketing', 'Real Estate', 'Entrepreneurship', 'Science / Research',
]

const STAGES = [
  { value: 'pre-college', label: 'Pre-college / High school' },
  { value: 'college-1', label: 'College — Year 1' },
  { value: 'college-2', label: 'College — Year 2' },
  { value: 'college-3', label: 'College — Year 3' },
  { value: 'college-4', label: 'College — Year 4' },
  { value: 'post-grad', label: 'Post-graduation' },
]

export default function ScholarOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    cohort_year: new Date().getFullYear(),
    college: '',
    current_stage: '',
    first_gen: false,
    career_interests: [] as string[],
    geographic_preference: '',
    gender: '',
  })

  function toggleCareer(c: string) {
    setForm(f => ({
      ...f,
      career_interests: f.career_interests.includes(c)
        ? f.career_interests.filter(x => x !== c)
        : [...f.career_interests, c],
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
    const { error: err } = await supabase.from('scholars').insert({ profile_id: user.id, ...form } as any)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    router.push('/scholar/matches')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
            <span className="text-sm text-gray-500">Step {step} of 2</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cohort year
                </label>
                <input
                  type="number"
                  min={2010}
                  max={2030}
                  required
                  value={form.cohort_year}
                  onChange={e => setForm(f => ({ ...f, cohort_year: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current stage
                </label>
                <select
                  required
                  value={form.current_stage}
                  onChange={e => setForm(f => ({ ...f, current_stage: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select…</option>
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College / university
                </label>
                <input
                  type="text"
                  value={form.college}
                  onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                  placeholder="e.g. Howard University"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City / region preference for connections
                </label>
                <input
                  type="text"
                  value={form.geographic_preference}
                  onChange={e => setForm(f => ({ ...f, geographic_preference: e.target.value }))}
                  placeholder="e.g. New York, NY"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="first_gen"
                  type="checkbox"
                  checked={form.first_gen}
                  onChange={e => setForm(f => ({ ...f, first_gen: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="first_gen" className="text-sm text-gray-700">
                  I am a first-generation college student
                </label>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.current_stage || !form.cohort_year}
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
                  Career interests{' '}
                  <span className="text-gray-400 font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAREER_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCareer(c)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.career_interests.includes(c)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
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
                  disabled={saving || form.career_interests.length === 0}
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
