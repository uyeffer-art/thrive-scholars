'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'paused',   label: 'Paused' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'retired',  label: 'Retired' },
]

export default function VolunteerActionsPanel({
  volunteerId,
  currentStatus,
  isStar,
  starNotes: initialStarNotes,
  isCorporatePartner: initialIsCorporate,
  corporatePartnerName: initialPartnerName,
  corporatePartnerPriority: initialPriority,
}: {
  volunteerId: string
  currentStatus: string
  isStar: boolean
  starNotes: string | null
  isCorporatePartner: boolean
  corporatePartnerName: string | null
  corporatePartnerPriority: number
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isStarVol, setIsStarVol] = useState(isStar)
  const [starNotes, setStarNotes] = useState(initialStarNotes ?? '')
  const [isCorporate, setIsCorporate] = useState(initialIsCorporate)
  const [partnerName, setPartnerName] = useState(initialPartnerName ?? '')
  const [partnerPriority, setPartnerPriority] = useState(initialPriority ?? 0)
  const [saving, setSaving] = useState(false)
  const [nudging, setNudging] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSuccess(null)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('volunteers')
      .update({
        status,
        is_star_volunteer: isStarVol,
        star_notes: isStarVol ? (starNotes || null) : null,
        is_corporate_partner: isCorporate,
        corporate_partner_name: isCorporate ? (partnerName || null) : null,
        corporate_partner_priority: isCorporate ? partnerPriority : 0,
      })
      .eq('id', volunteerId)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Saved.')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleNudge() {
    setNudging(true)
    setSuccess(null)
    setError(null)

    const res = await fetch('/api/email/volunteer-nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteer_id: volunteerId }),
    })

    if (!res.ok) {
      setError('Failed to send nudge. Check automation log.')
    } else {
      setSuccess('Nudge email sent.')
    }
    setNudging(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Staff actions</h2>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
      {success && <div className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</div>}

      {/* Status */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Volunteer status</label>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Corporate partner */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isCorporate} onChange={e => setIsCorporate(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Corporate partner volunteer</span>
        </label>
        {isCorporate && (
          <div className="space-y-2 pl-7">
            <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)}
              placeholder="Company name (e.g. Deloitte)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Matching priority (higher = preferred)</label>
              <input type="number" min={0} max={10} value={partnerPriority} onChange={e => setPartnerPriority(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Star volunteer */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isStarVol} onChange={e => setIsStarVol(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">⭐ Mark as star volunteer</span>
        </label>
        {isStarVol && (
          <textarea
            rows={2}
            value={starNotes}
            onChange={e => setStarNotes(e.target.value)}
            placeholder="Why this volunteer is exceptional…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors">
        {saving ? 'Saving…' : 'Save changes'}
      </button>

      {/* Inactivity nudge */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 mb-2">Send a re-engagement email to this volunteer.</p>
        <button onClick={handleNudge} disabled={nudging}
          className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {nudging ? 'Sending…' : 'Send inactivity nudge'}
        </button>
      </div>
    </div>
  )
}
