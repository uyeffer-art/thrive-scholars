import type { UserRole } from '@/lib/types/database'

export function roleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'scholar': return '/scholar/matches'
    case 'volunteer': return '/volunteer/matches'
    case 'staff':
    case 'admin': return '/dashboard'
  }
}
