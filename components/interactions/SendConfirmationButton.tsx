'use client'

import { useState } from 'react'

export default function SendConfirmationButton({ interactionId }: { interactionId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    setStatus('sending')
    const res = await fetch('/api/email/confirm-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interactionId }),
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  if (status === 'sent') return <span className="text-xs text-green-600">✓ Sent</span>
  if (status === 'error') return <span className="text-xs text-red-600">Failed</span>

  return (
    <button
      onClick={send}
      disabled={status === 'sending'}
      className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {status === 'sending' ? '…' : '✉ Send reminder'}
    </button>
  )
}
