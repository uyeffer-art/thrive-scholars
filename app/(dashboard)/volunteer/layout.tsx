import { requireRole } from '@/lib/utils/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/SignOutButton'
import ThriveLogo from '@/components/ui/ThriveLogo'

const navLinks = [
  { href: '/volunteer/matches',      label: 'My Matches' },
  { href: '/volunteer/interactions', label: 'Sessions' },
  { href: '/volunteer/training',     label: 'Training' },
  { href: '/volunteer/profile',      label: 'Profile' },
]

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  await requireRole('volunteer')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user!.id)
    .returns<{ first_name: string }[]>()
    .single()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav className="sticky top-0 z-30 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/volunteer/matches" className="flex-shrink-0">
              <ThriveLogo size="md" />
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="ts-nav-link">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide"
              style={{ background: 'var(--ts-very-light-blue)', color: 'var(--ts-blue)' }}>
              Volunteer
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--ts-dark-blue)' }}>
              {profile?.first_name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
