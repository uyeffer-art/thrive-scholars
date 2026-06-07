'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Program {
  id: string
  name: string
  program_type: string
}

interface ScoreBreakdown {
  career: number
  identity: number
  geography: number
  alma_mater: number
  engagement: number
  corporate_partner_boost: number
  composite: number
}

interface Candidate {
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  employer: string
  job_title: string
  industry: string
  is_corporate_partner: boolean
  corporate_partner_name: string | null
  is_star_volunteer: boolean
  total_matches_completed: number
  undergrad_institution: string | null
  race_ethnicity: string[]
  geographic_preference: string | null
  vector_similarity: number
  score: ScoreBreakdown
  rank: number
}

interface MatchResult {
  scholar_name: string
  program_name: string
  candidates: Candidate[]
  generated_at: string
}

export default function RunMatchingForm({
  scholarId,
  programs,
  reviewerId,
}: {
  scholarId: string
  programs: Program[]
  reviewerId: string
}) {
  const [selectedProgram, setSelectedProgram] = useState(programs[0]?.id ?? '')
  const [topN, setTopN] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [pmNotes, setPmNotes] = useState<Record<string, string>>({})

  async function handleRunMatching() {
    setLoading(true)
    setError(null)
    setResult(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/match-scholars`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          scholar_id: scholarId,
          program_id: selectedProgram,
          top_n: topN,
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Matching failed')
      setLoading(false)
      return
    }

    setResult(data)
    setLoading(false)
  }

  async function handleApprove(candidate: Candidate) {
    if (!result) return
    setApprovingId(candidate.volunteer_id)

    const supabase = createClient()

    const { error: err } = await supabase.rpc('approve_match', {
      p_scholar_id: scholarId,
      p_volunteer_id: candidate.volunteer_id,
      p_program_id: selectedProgram,
      p_ai_score: candidate.score.composite,
      p_score_breakdown: candidate.score,
      p_match_rank: candidate.rank,
      p_pm_notes: pmNotes[candidate.volunteer_id] ?? '',
      p_manually_selected: false,
      p_reviewer_id: reviewerId,
    })

    if (err) {
      setError(err.message)
    } else {
      setApproved(prev => new Set([...prev, candidate.volunteer_id]))

      // Get the match id and fire approval emails
      const supabase2 = createClient()
      const { data: match } = await supabase2
        .from('matches')
        .select('id')
        .eq('scholar_id', scholarId)
        .eq('volunteer_id', candidate.volunteer_id)
        .eq('program_id', selectedProgram)
        .single()

      if (match) {
        const matchId = (match as any).id
        // Fire email notification
        fetch('/api/email/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, event: 'approved' }),
        }).catch(console.error)
        // Trigger Make.com scenario
        fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_id: matchId, event_type: 'match_approved' }),
        }).catch(console.error)
      }
    }

    setApprovingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Matching configuration</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Top candidates</label>
            <select
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button
            onClick={handleRunMatching}
            disabled={loading || !selectedProgram}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {loading ? 'Running…' : 'Run matching'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              {result.candidates.length} candidates for {result.program_name}
            </h2>
            <p className="text-xs text-gray-400">
              Generated {new Date(result.generated_at).toLocaleTimeString()}
            </p>
          </div>

          {result.candidates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              No eligible volunteers found for this program. Make sure volunteers have completed their profiles.
            </div>
          ) : (
            <div className="space-y-4">
              {result.candidates.map(c => (
                <div
                  key={c.volunteer_id}
                  className={`bg-white rounded-xl border p-6 transition-colors ${
                    approved.has(c.volunteer_id)
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank + volunteer info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {c.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{c.volunteer_name}</p>
                          {c.is_star_volunteer && <span className="text-sm">⭐</span>}
                          {c.is_corporate_partner && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                              {c.corporate_partner_name ?? 'Partner'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {c.job_title} · {c.employer}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          {c.undergrad_institution && <span>🎓 {c.undergrad_institution}</span>}
                          {c.geographic_preference && <span>📍 {c.geographic_preference}</span>}
                          <span>{c.total_matches_completed} matches completed</span>
                        </div>
                      </div>
                    </div>

                    {/* Composite score */}
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${
                        c.score.composite >= 0.7 ? 'text-green-600' :
                        c.score.composite >= 0.5 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {(c.score.composite * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-400">composite</p>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {[
                      { key: 'career', label: 'Career' },
                      { key: 'identity', label: 'Identity' },
                      { key: 'geography', label: 'Geography' },
                      { key: 'alma_mater', label: 'Alma mater' },
                      { key: 'engagement', label: 'Engagement' },
                    ].map(({ key, label }) => {
                      const val = c.score[key as keyof ScoreBreakdown] as number
                      return (
                        <div key={key} className="text-center">
                          <div className="h-1.5 bg-gray-100 rounded-full mb-1">
                            <div
                              className="h-1.5 bg-blue-400 rounded-full"
                              style={{ width: `${Math.min(100, val * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-xs font-medium text-gray-700">{(val * 100).toFixed(0)}%</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* PM notes + approve */}
                  {!approved.has(c.volunteer_id) && (
                    <div className="mt-4 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">PM notes (optional)</label>
                        <input
                          type="text"
                          placeholder="Why this match, any caveats…"
                          value={pmNotes[c.volunteer_id] ?? ''}
                          onChange={e => setPmNotes(prev => ({ ...prev, [c.volunteer_id]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => handleApprove(c)}
                        disabled={approvingId === c.volunteer_id}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        {approvingId === c.volunteer_id ? 'Approving…' : 'Approve match'}
                      </button>
                    </div>
                  )}

                  {approved.has(c.volunteer_id) && (
                    <div className="mt-4 text-sm text-green-700 font-medium">
                      ✓ Match approved — Make.com will send emails and sync to Salesforce
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
