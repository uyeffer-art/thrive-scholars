import { requireStaff } from '@/lib/utils/auth'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SignOutButton from '@/components/auth/SignOutButton'
import ThriveLogo from '@/components/ui/ThriveLogo'

const navLinks = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/scholars',       label: 'Scholars' },
  { href: '/volunteers',     label: 'Volunteers' },
  { href: '/programs',       label: 'Programs' },
  { href: '/matches',        label: 'Matches' },
  { href: '/interactions',   label: 'Interactions' },
  { href: '/training',       label: 'Training' },
  { href: '/salesforce',     label: 'Salesforce' },
  { href: '/reminders',      label: 'Reminders' },
  { href: '/automation-log', label: 'Log' },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStaff()

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('first_name, role').eq('id', user.id).single()
  const p = profile as any

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-30 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo + nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex-shrink-0">
              <ThriveLogo size="md" />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--ts-light-gray)' }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--ts-dark-blue)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--ts-very-light-blue)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--ts-light-gray)'
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide"
              style={{ background: 'var(--ts-very-light-blue)', color: 'var(--ts-blue)' }}
            >
              {p?.role}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--ts-dark-blue)' }}>
              {p?.first_name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
