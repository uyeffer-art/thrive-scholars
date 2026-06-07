'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CONTENT_TYPE_ICONS: Record<string, string> = {
  video:   '🎬',
  article: '📄',
  pdf:     '📋',
  quiz:    '✅',
}

const STATUS_STYLES: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-50 text-amber-700',
  completed:   'bg-green-50 text-green-700',
}

export default function TrainingModuleCard({
  module,
  completion,
  profileId,
}: {
  module: any
  completion: any | null
  profileId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const status = completion?.status ?? 'not_started'
  const isCompleted = status === 'completed'

  async function handleMarkComplete() {
    setLoading(true)
    const supabase = createClient()

    if (!completion) {
      // Create new completion record
      await supabase.from('training_completions').insert({
        profile_id: profileId,
        module_id: module.id,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
    } else {
      // Update existing
      await supabase
        .from('training_completions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', completion.id)
    }

    router.refresh()
    setLoading(false)
  }

  async function handleStarted() {
    if (completion || isCompleted) return
    const supabase = createClient()
    await supabase.from('training_completions').insert({
      profile_id: profileId,
      module_id: module.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    router.refresh()
  }

  return (
    <div className={`bg-white rounded-xl border p-5 transition-colors ${
      isCompleted ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Completion indicator */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isCompleted ? 'bg-green-500' : status === 'in_progress' ? 'bg-amber-400' : 'bg-gray-200'
          }`}>
            {isCompleted && <span className="text-white text-xs">✓</span>}
            {status === 'in_progress' && <span className="text-white text-xs">…</span>}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">{module.title}</p>
              {module.is_required && (
                <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">Required</span>
              )}
              <span className="text-xs text-gray-400">
                {CONTENT_TYPE_ICONS[module.content_type] ?? '📎'} {module.content_type}
              </span>
            </div>
            {module.description && (
              <p className="text-sm text-gray-500 mt-0.5">{module.description}</p>
            )}
            {isCompleted && completion?.completed_at && (
              <p className="text-xs text-green-600 mt-1">
                Completed {new Date(completion.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {module.content_url && (
            <a
              href={module.content_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleStarted}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Open →
            </a>
          )}
          {!isCompleted && (
            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '…' : 'Mark complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
