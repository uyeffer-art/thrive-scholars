'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PROGRAM_TYPES = ['mentorship_year', 'coffee_chat', 'mock_interview', 'resume_review']

export default function EditTrainingModuleForm({ module }: { module: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState(module.title ?? '')
  const [description, setDescription] = useState(module.description ?? '')
  const [audience, setAudience] = useState(module.audience ?? 'volunteer')
  const [contentUrl, setContentUrl] = useState(module.content_url ?? '')
  const [contentType, setContentType] = useState(module.content_type ?? 'article')
  const [isRequired, setIsRequired] = useState(module.is_required ?? true)
  const [isActive, setIsActive] = useState(module.is_active ?? true)
  const [orderIndex, setOrderIndex] = useState(module.order_index ?? 0)
  const [programTypes, setProgramTypes] = useState<string[]>(module.program_types ?? [])

  function toggleProgramType(pt: string) {
    setProgramTypes(prev =>
      prev.includes(pt) ? prev.filter(x => x !== pt) : [...prev, pt]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('training_modules')
      .update({
        title,
        description: description || null,
        audience,
        content_url: contentUrl || null,
        content_type: contentType,
        is_required: isRequired,
        is_active: isActive,
        order_index: orderIndex,
        program_types: programTypes.length > 0 ? programTypes : null,
      })
      .eq('id', module.id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Module saved successfully.</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief summary shown to users before they start"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="volunteer">Volunteer</option>
              <option value="scholar">Scholar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content type</label>
            <select value={contentType} onChange={e => setContentType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
          <input type="url" value={contentUrl} onChange={e => setContentUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
            <input type="number" min={0} value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-2 justify-end pb-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Required module</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Active (visible to users)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applicable programs <span className="text-gray-400 font-normal">(leave blank for all)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PROGRAM_TYPES.map(pt => (
              <button key={pt} type="button" onClick={() => toggleProgramType(pt)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors capitalize ${
                  programTypes.includes(pt)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                {pt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/training"
          className="flex-1 text-center py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors">
          Cancel
        </Link>
        <button type="submit" disabled={saving || !title}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
