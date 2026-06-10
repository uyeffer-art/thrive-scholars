'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FeedbackForm({
  interactionId,
  role,
  existingRating,
  existingNotes,
}: {
  interactionId: string
  role: 'scholar' | 'volunteer'
  existingRating: number | null
  existingNotes: string | null
}) {
  const router = useRouter()
  const [rating, setRating] = useState<number>(existingRating ?? 0)
  const [notes, setNotes] = useState(existingNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const ratingField = role === 'scholar' ? 'scholar_rating' : 'volunteer_rating'
  const notesField  = role === 'scholar' ? 'scholar_notes'  : 'volunteer_notes'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('interactions')
      .update({ [ratingField]: rating, [notesField]: notes || null })
      .eq('id', interactionId)

    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  if (saved || existingRating) {
    return (
      <div className="mt-3 text-xs text-gray-500">
        {existingRating && !saved
          ? `Your rating: ${'★'.repeat(existingRating)}${'☆'.repeat(5 - existingRating)}`
          : '✓ Feedback submitted'}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">How did it go?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-xl transition-colors ${n <= rating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Any notes about the session… (optional)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={saving || rating === 0}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : 'Submit feedback'}
      </button>
    </form>
  )
}
