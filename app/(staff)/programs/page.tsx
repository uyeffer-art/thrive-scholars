import { requireStaff } from '@/lib/utils/auth'

export default async function StaffProgramsPage() {
  await requireStaff()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 capitalize">programs</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">Coming soon</div>
    </div>
  )
}
