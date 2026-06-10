'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PROGRAM_TYPES = [
  { value: 'mentorship_year', label: 'Mentorship Year' },
  { value: 'coffee_chat', label: 'Coffee Chat' },
  { value: 'mock_interview', label: 'Mock Interview' },
  { value: 'resume_review', label: 'Resume Review' },
]

const WEIGHT_KEYS = ['career', 'identity', 'geography', 'alma_mater', 'engagement'] as const

const DEFAULT_WEIGHTS: Record<typeof WEIGHT_KEYS[number], number> = {
  career: 0.35,
  identity: 0.20,
  geography: 0.15,
  alma_mater: 0.15,
  engagement: 0.15,
}

export default function NewProgramPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [programType, setProgramType] = useState('mentorship_year')
  const [timeoutDays, setTimeoutDays] = useState(7)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS })

  const weightsTotal = Object.values(weights).reduce((a, b) => a + b, 0)
  const weightsValid = Math.abs(weightsTotal - 1) < 0.001

  function updateWeight(key: typeof WEIGHT_KEYS[number], value: number) {
    setWeights(w => ({ ...w, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!weightsValid) {
      setError(`Matching weights must sum to 100%. Currently: ${(weightsTotal * 100).toFixed(1)}%`)
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('programs')
      .insert({
        name,
        description: description || null,
        program_type: programType,
        is_active: true,
        match_timeout_days: timeoutDays,
        matching_weights: weights,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    router.push(`/programs/${data.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/programs" className="hover:text-gray-700">Programs</Link>
        <span>→</span>
        <span>New program</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New program</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Mentorship Year 2026–27"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program type</label>
            <select value={programType} onChange={e => setProgramType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PROGRAM_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match timeout <span className="text-gray-400 font-normal">(days before unanswered match escalates)</span>
            </label>
            <input type="number" min={1} max={30} value={timeoutDays} onChange={e => setTimeoutDays(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Matching weights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Matching weights</h2>
            <span className={`text-sm font-medium ${weightsValid ? 'text-green-600' : 'text-red-500'}`}>
              Total: {(weightsTotal * 100).toFixed(1)}% {weightsValid ? '✓' : '(must equal 100%)'}
            </span>
          </div>

          <div className="space-y-4">
            {WEIGHT_KEYS.map(key => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {(weights[key] * 100).toFixed(0)}%
                  </span>
                </div>
                <input type="range" min={0} max={100} step={5}
                  value={Math.round(weights[key] * 100)}
                  onChange={e => updateWeight(key, Number(e.target.value) / 100)}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Adjust sliders so the total equals 100%. These weights apply to all matching runs for this program.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/programs"
            className="flex-1 text-center py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving || !name || !weightsValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Creating…' : 'Create program'}
          </button>
        </div>
      </form>
    </div>
  )
}
