import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RunMatchingForm from '@/components/matches/RunMatchingForm'

export default async function RunMatchingPage({
  params,
}: {
  params: Promise<{ scholarId: string }>
}) {
  const { user } = await requireStaff()
  const { scholarId } = await params
  const admin = createAdminClient()

  const { data: scholar } = await admin
    .from('scholars')
    .select('id, college, current_stage, career_interests, profiles(first_name, last_name)')
    .eq('id', scholarId)
    .single()

  if (!scholar) notFound()

  const { data: programs } = await admin
    .from('programs')
    .select('id, name, program_type')
    .eq('is_active', true)
    .order('name')

  const s = scholar as any
  const p = s.profiles

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/scholars" className="hover:text-gray-700">Scholars</Link>
        <span>→</span>
        <Link href={`/scholars/${scholarId}`} className="hover:text-gray-700">
          {p?.first_name} {p?.last_name}
        </Link>
        <span>→</span>
        <span>Run Matching</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Run Matching — {p?.first_name} {p?.last_name}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {s.current_stage?.replace(/-/g, ' ')} · {s.college} · {s.career_interests?.join(', ')}
      </p>

      <RunMatchingForm
        scholarId={scholarId}
        programs={programs ?? []}
        reviewerId={user.id}
      />
    </div>
  )
}
