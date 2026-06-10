import { requireRole } from '@/lib/utils/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/SignOutButton'

export default async function ScholarLayout({ children }: { children: React.ReactNode }) {
  await requireRole('scholar')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user!.id).returns<{ first_name: string }[]>().single()

  const navLinks = [
    { href: '/scholar/matches', label: 'My Matches' },
    { href: '/scholar/interactions', label: 'Sessions' },
    { href: '/scholar/training', label: 'Training' },
    { href: '/scholar/profile', label: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Thrive Scholars</span>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{profile?.first_name}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
