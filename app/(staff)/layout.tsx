import { requireStaff } from '@/lib/utils/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/SignOutButton'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('first_name, role').eq('id', user!.id).returns<{ first_name: string; role: string }[]>().single()

  const navLinks = [
    { href: '/staff/dashboard', label: 'Dashboard' },
    { href: '/staff/scholars', label: 'Scholars' },
    { href: '/staff/volunteers', label: 'Volunteers' },
    { href: '/staff/programs', label: 'Programs' },
    { href: '/staff/matches', label: 'Matches' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Thrive — Staff</span>
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
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium capitalize">
              {profile?.role}
            </span>
            <span className="text-sm text-gray-600">{profile?.first_name}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
