'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { roleDashboardPath } from '@/lib/utils/roles'
import type { UserRole } from '@/lib/types/database'
import ThriveLogo from '@/components/ui/ThriveLogo'

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <ThriveLogo size="lg" variant="light" />
          <p style={{ color: '#a8cfe0', fontSize: '14px', marginTop: '16px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#102b4e' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#005191', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
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
