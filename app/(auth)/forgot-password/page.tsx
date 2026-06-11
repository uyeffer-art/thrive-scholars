'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ThriveLogo from '@/components/ui/ThriveLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #002d52 0%, #005191 60%, #61aac6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <ThriveLogo size="lg" variant="light" />
        </div>

        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#102b4e', margin: 0 }}>Check your email</h1>
              <p style={{ fontSize: '14px', color: '#606673', marginTop: '10px', lineHeight: 1.5 }}>
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
                The link expires in 1 hour.
              </p>
              <Link href="/login" style={{ display: 'inline-block', marginTop: '24px', color: '#005191', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#102b4e', margin: 0 }}>Reset your password</h1>
              <p style={{ fontSize: '14px', color: '#606673', marginTop: '8px', marginBottom: '24px', lineHeight: 1.5 }}>
                Enter the email you use to sign in and we'll send you a link to choose a new password.
              </p>

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#102b4e', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    type="email" autoComplete="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde8f0', borderRadius: '10px', fontSize: '14px', color: '#102b4e', background: '#f4f8fb', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? '#61aac6' : '#005191', color: '#fff', fontWeight: 700, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '13px', color: '#606673', marginTop: '20px' }}>
                Remembered it?{' '}
                <Link href="/login" style={{ color: '#005191', fontWeight: 600, textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
