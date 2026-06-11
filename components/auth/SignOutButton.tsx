'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
      style={{
        color: 'var(--ts-light-gray)',
        borderColor: 'var(--border)',
        background: 'transparent',
      }}
    >
      Sign out
    </button>
  )
}
