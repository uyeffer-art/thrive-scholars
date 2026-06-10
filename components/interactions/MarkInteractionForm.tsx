'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkInteractionForm({ interactionId }: { interactionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'held' | 'missed' | null>(null)

  async function mark(status: 'held' | 'missed') {
    setLoading(status)
    const supabase = createClient()
    await supabase
      .from('interactions')
      .update({
        status,
        ...(status === 'held' ? { held_at: new Date().toISOString() } : {}),
      })
      .eq('id', interactionId)

    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => mark('held')} disabled={loading !== null}
        className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded transition-colors disabled:opacity-50">
        {loading === 'held' ? '…' : 'Held'}
      </button>
      <button onClick={() => mark('missed')} disabled={loading !== null}
        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded transition-colors disabled:opacity-50">
        {loading === 'missed' ? '…' : 'Missed'}
      </button>
    </div>
  )
}
