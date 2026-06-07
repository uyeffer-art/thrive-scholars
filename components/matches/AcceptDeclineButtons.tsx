'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptDeclineButtons({
  matchId,
  role,
}: {
  matchId: string
  role: 'scholar' | 'volunteer'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handle(action: 'accept' | 'decline') {
    setLoading(action)
    setError(null)

    const supabase = createClient()
    const now = new Date().toISOString()

    let updatePayload: Record<string, any> = {}

    if (action === 'decline') {
      updatePayload = { status: 'declined' }
    } else if (role === 'scholar') {
      updatePayload = { scholar_accepted_at: now }
    } else {
      updatePayload = { volunteer_accepted_at: now }
    }

    // Check if both parties have accepted — if so, set status to active
    if (action === 'accept') {
      const { data: match } = await supabase
        .from('matches')
        .select('scholar_accepted_at, volunteer_accepted_at')
        .eq('id', matchId)
        .single()

      const otherAccepted = role === 'scholar'
        ? (match as any)?.volunteer_accepted_at
        : (match as any)?.scholar_accepted_at

      if (otherAccepted) {
        updatePayload.status = 'active'
      }
    }

    const { error: err } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', matchId)

    if (err) {
      setError(err.message)
    } else {
      // If match just became active, fire active emails and Make.com trigger
      if (updatePayload.status === 'active') {
        fetch('/api/email/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, event: 'active' }),
        }).catch(console.error)
        fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, event_type: 'match_active' }),
        }).catch(console.error)
      }
      router.refresh()
    }

    setLoading(null)
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={() => handle('decline')}
        disabled={loading !== null}
        className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === 'decline' ? 'Declining…' : 'Decline'}
      </button>
      <button
        onClick={() => handle('accept')}
        disabled={loading !== null}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === 'accept' ? 'Accepting…' : 'Accept match'}
      </button>
    </div>
  )
}
