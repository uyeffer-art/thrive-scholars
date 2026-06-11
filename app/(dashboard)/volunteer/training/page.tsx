import { requireRole } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import TrainingModuleCard from '@/components/training/TrainingModuleCard'
import EmptyState from '@/components/ui/EmptyState'

export default async function VolunteerTrainingPage() {
  const { user } = await requireRole('volunteer')
  const admin = createAdminClient()

  const { data: modules } = await admin
    .from('training_modules')
    .select('*')
    .eq('audience', 'volunteer')
    .eq('is_active', true)
    .order('order_index')

  const { data: completions } = await admin
    .from('training_completions')
    .select('*')
    .eq('profile_id', user.id)

  const completionMap: Record<string, any> = {}
  ;(completions ?? []).forEach((c: any) => {
    completionMap[c.module_id] = c
  })

  const required = (modules ?? []).filter((m: any) => m.is_required)
  const optional = (modules ?? []).filter((m: any) => !m.is_required)
  const completedRequired = required.filter((m: any) => completionMap[m.id]?.status === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training</h1>
        {required.length > 0 && (
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            completedRequired === required.length
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            {completedRequired}/{required.length} required complete
          </span>
        )}
      </div>

      {(!modules || modules.length === 0) ? (
        <EmptyState
          icon="📚"
          title="No training modules yet"
          message="Your program team hasn't published volunteer training yet. When they do, your mentor-prep modules will appear here."
          hint="Training is short and helps you show up confident and ready for your scholar — check back soon!"
        />
      ) : (
        <div className="space-y-8">
          {required.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Required</h2>
              <div className="space-y-3">
                {required.map((m: any) => (
                  <TrainingModuleCard
                    key={m.id}
                    module={m}
                    completion={completionMap[m.id] ?? null}
                    profileId={user.id}
                  />
                ))}
              </div>
            </div>
          )}
          {optional.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Optional</h2>
              <div className="space-y-3">
                {optional.map((m: any) => (
                  <TrainingModuleCard
                    key={m.id}
                    module={m}
                    completion={completionMap[m.id] ?? null}
                    profileId={user.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
