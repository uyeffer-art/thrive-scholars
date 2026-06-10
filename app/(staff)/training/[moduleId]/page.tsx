import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import EditTrainingModuleForm from '@/components/training/EditTrainingModuleForm'
import Link from 'next/link'

export default async function EditTrainingModulePage({ params }: { params: { moduleId: string } }) {
  await requireStaff()
  const admin = createAdminClient()

  const { data: module } = await admin
    .from('training_modules')
    .select('*')
    .eq('id', params.moduleId)
    .single()

  if (!module) notFound()

  // Completion stats
  const { data: completions } = await admin
    .from('training_completions')
    .select('status')
    .eq('module_id', params.moduleId)

  const total = completions?.length ?? 0
  const completed = completions?.filter((c: any) => c.status === 'completed').length ?? 0

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/training" className="hover:text-gray-700">Training</Link>
        <span>→</span>
        <span className="truncate">{module.title}</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit module</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{completed} / {total} completed</span>
        </div>
      </div>

      <EditTrainingModuleForm module={module as any} />
    </div>
  )
}
