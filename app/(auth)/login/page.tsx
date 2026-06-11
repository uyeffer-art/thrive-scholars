'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { roleDashboardPath } from '@/lib/utils/roles'
import type { UserRole } from '@/lib/types/database'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .returns<{ role: UserRole }[]>()
        .single()

      if (profile) {
        router.push(roleDashboardPath(profile.role))
        return
      }
    }

    router.push('/onboarding/scholar')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #002d52 0%, #005191 60%, #61aac6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* T mark */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '10px', borderRadius: '5px', background: '#ffffff'
              }} />
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '10px', height: '100%', borderRadius: '5px', background: '#ffffff'
              }} />
              <div style={{
                position: 'absolute', bottom: '2px', right: '4px',
                width: '14px', height: '14px', borderRadius: '50%', background: '#f7b926'
              }} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Thrive
            </span>
            <span style={{ fontSize: '32px', fontWeight: '300', color: '#d9e9f1', letterSpacing: '-0.5px', marginLeft: '8px' }}>
              Scholars
            </span>
          </div>
          <p style={{ color: '#a8cfe0', fontSize: '14px', marginTop: '6px' }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '12px 16px',
              color: '#dc2626', fontSize: '14px', marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#102b4e', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px',
                  border: '1.5px solid #dde8f0', borderRadius: '10px',
                  fontSize: '14px', color: '#102b4e', background: '#f4f8fb',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#102b4e', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px',
                  border: '1.5px solid #dde8f0', borderRadius: '10px',
                  fontSize: '14px', color: '#102b4e', background: '#f4f8fb',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#61aac6' : '#005191',
                color: '#ffffff', fontWeight: '700',
                fontSize: '15px', borderRadius: '10px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px', letterSpacing: '0.2px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#606673', marginTop: '20px' }}>
            New volunteer?{' '}
            <Link href="/signup" style={{ color: '#005191', fontWeight: '600', textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8cfe0', marginTop: '24px' }}>
          © {new Date().getFullYear()} Thrive Scholars
        </p>
      </div>
    </div>
  )
}
