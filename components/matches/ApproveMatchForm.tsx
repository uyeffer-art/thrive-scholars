'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/lib/types/database'

export default function ApproveMatchForm({ match }: { match: Match }) {
  const router = useRouter()
  const [pmNotes, setPmNotes] = useState(match.pm_notes ?? '')
  const [loading, setLoading] = useState<'approve' | 'decline' | 'cancel' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  async function handleApprove() {
    setLoading('approve')
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.rpc('approve_match', {
      p_scholar_id: match.scholar_id,
      p_volunteer_id: match.volunteer_id,
      p_program_id: match.program_id,
      p_ai_score: match.ai_score ?? 0,
      p_score_breakdown: match.score_breakdown ?? {},
      p_match_rank: match.match_rank ?? 1,
      p_pm_notes: pmNotes,
      p_manually_selected: match.manually_selected,
      p_reviewer_id: user!.id,
    })

    if (err) {
      setError(err.message)
      setLoading(null)
      return
    }

    // Fire match approved emails (non-blocking)
    fetch('/api/email/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, event: 'approved' }),
    }).catch(console.error)

    router.push('/matches?status=approved')
    router.refresh()
  }

  async function handleDecline() {
    setLoading('decline')
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('matches')
      .update({ status: 'declined', pm_notes: pmNotes })
      .eq('id', match.id)

    if (err) {
      setError(err.message)
      setLoading(null)
      return
    }

    router.push('/staff/matches')
    router.refresh()
  }

  async function handleCancel() {
    if (!confirm('Cancel this match? This cannot be undone.')) return
    setLoading('cancel')
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('matches')
      .update({ status: 'cancelled', pm_notes: pmNotes })
      .eq('id', match.id)

    if (err) {
      setError(err.message)
      setLoading(null)
      return
    }

    router.refresh()
    setLoading(null)
  }

  async function handleResendEmail() {
    setLoading('email')
    setEmailSent(false)
    setError(null)

    const res = await fetch('/api/email/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, event: 'approved' }),
    })

    if (!res.ok) {
      setError('Failed to send email. Check automation log.')
    } else {
      setEmailSent(true)
    }
    setLoading(null)
  }

  const isReviewable = ['suggested', 'pending_approval'].includes(match.status)
  const isActive = ['approved', 'active'].includes(match.status)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">PM Review</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}
      {emailSent && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">
          Match email sent successfully.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(visible in automation log)</span>
        </label>
        <textarea
          rows={3}
          value={pmNotes}
          onChange={e => setPmNotes(e.target.value)}
          placeholder="Why this match, any caveats, manual override rationale…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isReviewable && (
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={loading !== null}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading === 'decline' ? 'Declining…' : 'Decline'}
          </button>
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading === 'approve' ? 'Approving…' : 'Approve match'}
          </button>
        </div>
      )}

      {isActive && (
        <div className="flex gap-3">
          <button
            onClick={handleResendEmail}
            disabled={loading !== null}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading === 'email' ? 'Sending…' : 'Resend match email'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading === 'cancel' ? 'Cancelling…' : 'Cancel match'}
          </button>
        </div>
      )}

      {!isReviewable && !isActive && (
        <div className="text-sm text-gray-500">
          Status: <span className="font-medium text-gray-700 capitalize">{match.status}</span>
        </div>
      )}
    </div>
  )
}
