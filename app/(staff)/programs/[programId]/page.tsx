import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditProgramForm from '@/components/programs/EditProgramForm'

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>
}) {
  await requireStaff()
  const { programId } = await params
  const admin = createAdminClient()

  const { data: program } = await admin
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (!program) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/programs" className="hover:text-gray-700">Programs</Link>
        <span>→</span>
        <span>{(program as any).name}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{(program as any).name}</h1>

      <EditProgramForm program={program as any} />
    </div>
  )
}
