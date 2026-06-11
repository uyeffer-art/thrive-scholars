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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      {/* Decorative top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #005191 0%, #61aac6 60%, #f7b926 100%)' }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <ThriveLogo size="lg" />
          <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            Sign in to your account
          </p>
        </div>

        <div
          className="rounded-2xl p-8 space-y-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(0,81,145,0.07)' }}
        >
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
              style={{
                border: '1.5px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
              style={{
                border: '1.5px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-semibold py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: loading ? '#61aac6' : '#005191',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
            New volunteer?{' '}
            <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--ts-blue)' }}>
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          © {new Date().getFullYear()} Thrive Scholars. All rights reserved.
        </p>
      </div>
    </div>
  )
}
