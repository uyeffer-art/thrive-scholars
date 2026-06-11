import { requireRole } from '@/lib/utils/auth'
import FeedbackForm from '@/components/interactions/FeedbackForm'
import MarkInteractionForm from '@/components/interactions/MarkInteractionForm'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  held:       'bg-green-50 text-green-700',
  missed:     'bg-red-50 text-red-700',
  cancelled:  'bg-gray-100 text-gray-500',
}

export default async function VolunteerInteractionsPage() {
  const { supabase, user } = await requireRole('volunteer')

  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id')
    .eq('profile_id', user.id)
    .returns<{ id: string }[]>()
    .single()

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*, matches(programs(name)), scholars(profiles(first_name, last_name))')
    .eq('volunteer_id', volunteer?.id ?? '')
    .order('scheduled_at', { ascending: false })

  const now = new Date().toISOString()
  const unconfirmed = (interactions ?? []).filter(
    (i: any) => i.status === 'scheduled' && i.scheduled_at && i.scheduled_at < now
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h1>

      {unconfirmed.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            📋 {unconfirmed.length} session{unconfirmed.length > 1 ? 's' : ''} need{unconfirmed.length === 1 ? 's' : ''} confirmation
          </p>
          <p className="text-xs text-amber-700">
            Did these sessions happen? Please mark each one as Held or Missed below so we can keep records up to date.
          </p>
        </div>
      )}

      {(!interactions || interactions.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(interactions as any[]).map(i => {
            const isPast = i.scheduled_at && i.scheduled_at < now
            const needsConfirmation = i.status === 'scheduled' && isPast

            return (
              <div key={i.id} className={`bg-white rounded-xl border p-5 ${needsConfirmation ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {i.scholars?.profiles?.first_name} {i.scholars?.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{i.matches?.programs?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                      {i.duration_minutes ? ` · ${i.duration_minutes} min` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[i.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {needsConfirmation ? 'Needs confirmation' : i.status}
                  </span>
                </div>

                {needsConfirmation && (
                  <div className="mt-3 pt-3 border-t border-amber-100">
                    <p className="text-xs text-gray-500 mb-2">Did this session happen?</p>
                    <MarkInteractionForm interactionId={i.id} />
                  </div>
                )}

                {i.status === 'held' && (
                  <FeedbackForm
                    interactionId={i.id}
                    role="volunteer"
                    existingRating={i.volunteer_rating}
                    existingNotes={i.volunteer_notes}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
