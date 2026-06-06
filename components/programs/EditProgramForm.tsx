'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Program {
  id: string
  name: string
  description: string | null
  program_type: string
  is_active: boolean
  match_timeout_days: number
  matching_weights: {
    career: number
    identity: number
    geography: number
    alma_mater: number
    engagement: number
  }
  start_date: string | null
  end_date: string | null
}

const WEIGHT_KEYS = ['career', 'identity', 'geography', 'alma_mater', 'engagement'] as const

export default function EditProgramForm({ program }: { program: Program }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(program.name)
  const [description, setDescription] = useState(program.description ?? '')
  const [isActive, setIsActive] = useState(program.is_active)
  const [timeoutDays, setTimeoutDays] = useState(program.match_timeout_days)
  const [startDate, setStartDate] = useState(program.start_date ?? '')
  const [endDate, setEndDate] = useState(program.end_date ?? '')
  const [weights, setWeights] = useState({ ...program.matching_weights })

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
    setSuccess(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('programs')
      .update({
        name,
        description: description || null,
        is_active: isActive,
        match_timeout_days: timeoutDays,
        matching_weights: weights,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .eq('id', program.id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Program saved successfully.
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match timeout <span className="text-gray-400 font-normal">(days)</span>
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={timeoutDays}
              onChange={e => setTimeoutDays(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Program is active</span>
            </label>
          </div>
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
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(weights[key] * 100)}
                onChange={e => updateWeight(key, Number(e.target.value) / 100)}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Adjust sliders so the total equals 100%. These weights apply to all future matching runs for this program.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving || !weightsValid}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
