'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ThriveLogo from '@/components/ui/ThriveLogo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [validLink, setValidLink] = useState(true)

  // When the user arrives from the email link, Supabase establishes a
  // recovery session automatically. Confirm we have one.
  useEffect(() => {
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setValidLink(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setValidLink(false)
      setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2500)
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
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#102b4e', margin: 0 }}>Password updated</h1>
              <p style={{ fontSize: '14px', color: '#606673', marginTop: '10px' }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : ready && !validLink ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#102b4e', margin: 0 }}>Link expired or invalid</h1>
              <p style={{ fontSize: '14px', color: '#606673', marginTop: '10px', lineHeight: 1.5 }}>
                This reset link is no longer valid. Request a fresh one and try again.
              </p>
              <Link href="/forgot-password" style={{ display: 'inline-block', marginTop: '24px', color: '#005191', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                Request a new link →
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#102b4e', margin: 0 }}>Choose a new password</h1>
              <p style={{ fontSize: '14px', color: '#606673', marginTop: '8px', marginBottom: '24px' }}>
                Enter a new password for your account.
              </p>

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#102b4e', marginBottom: '6px' }}>New password</label>
                  <input type="password" autoComplete="new-password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde8f0', borderRadius: '10px', fontSize: '14px', color: '#102b4e', background: '#f4f8fb', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#102b4e', marginBottom: '6px' }}>Confirm new password</label>
                  <input type="password" autoComplete="new-password" required value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde8f0', borderRadius: '10px', fontSize: '14px', color: '#102b4e', background: '#f4f8fb', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? '#61aac6' : '#005191', color: '#fff', fontWeight: 700, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
