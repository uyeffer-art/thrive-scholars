import { requireStaff } from '@/lib/utils/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ApproveMatchForm from '@/components/matches/ApproveMatchForm'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { user } = await requireStaff()
  const { matchId } = await params
  const admin = createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select(`
      *,
      programs (name, program_type, matching_weights),
      scholars (
        id, cohort_year, college, current_stage, career_interests, race_ethnicity, gender, first_gen, geographic_preference,
        profiles (first_name, last_name, email)
      ),
      volunteers (
        id, employer, job_title, industry, is_corporate_partner, corporate_partner_name,
        is_star_volunteer, total_matches_completed, undergrad_institution, cal_booking_url,
        race_ethnicity, gender, first_gen, geographic_preference,
        profiles (first_name, last_name, email)
      )
    `)
    .eq('id', matchId)
    .single()

  if (!match) notFound()

  const scholar = (match as any).scholars
  const volunteer = (match as any).volunteers
  const program = (match as any).programs

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/matches" className="hover:text-gray-700">Matches</Link>
        <span>→</span>
        <span>{scholar.profiles.first_name} {scholar.profiles.last_name} × {volunteer.profiles.first_name} {volunteer.profiles.last_name}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Match Detail</h1>
      <p className="text-gray-500 text-sm mb-6">{program.name}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ProfileCard
          label="Scholar"
          name={`${scholar.profiles.first_name} ${scholar.profiles.last_name}`}
          lines={[
            scholar.current_stage,
            scholar.college,
            scholar.career_interests?.join(', '),
          ]}
        />
        <ProfileCard
          label="Volunteer"
          name={`${volunteer.profiles.first_name} ${volunteer.profiles.last_name}`}
          lines={[
            `${volunteer.job_title} @ ${volunteer.employer}`,
            volunteer.undergrad_institution,
            volunteer.is_star_volunteer ? '⭐ Star volunteer' : null,
            volunteer.is_corporate_partner ? `Partner: ${volunteer.corporate_partner_name}` : null,
          ]}
        />
      </div>

      {match.score_breakdown && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">AI Score Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(match.score_breakdown as Record<string, number>).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36 capitalize">{k.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(100, v * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {(v * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ApproveMatchForm match={match as any} />
    </div>
  )
}

function ProfileCard({ label, name, lines }: { label: string; name: string; lines: (string | null | undefined)[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{name}</p>
      {lines.filter(Boolean).map((line, i) => (
        <p key={i} className="text-sm text-gray-600 mt-0.5">{line}</p>
      ))}
    </div>
  )
}
