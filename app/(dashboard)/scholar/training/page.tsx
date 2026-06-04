import { requireRole } from '@/lib/utils/auth'

export default async function ScholarTrainingPage() {
  const { supabase } = await requireRole('scholar')
  const { data: modules } = await supabase
    .from('training_modules').select('*').eq('audience', 'scholar').eq('is_active', true).order('order_index')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Training</h1>
      <div className="space-y-3">
        {(modules ?? []).map((m: any) => (
          <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{m.title}</p>
              <p className="text-sm text-gray-500">{m.description}</p>
            </div>
            {m.is_required && <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Required</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
