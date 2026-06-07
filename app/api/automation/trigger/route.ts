import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Make.com webhook URL — receives all match events
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/m6qhrenwebmva62r3b8tsyclxg5ys6h4'

// POST /api/automation/trigger
// Body: { match_id: string, event_type: string }
// Called internally after match state changes (approve, accept, active, etc.)
export async function POST(request: Request) {
  const { match_id, event_type } = await request.json()

  if (!match_id || !event_type) {
    return NextResponse.json({ error: 'match_id and event_type required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch full match context for the payload
  const { data: match } = await admin
    .from('matches')
    .select(`
      id, status, ai_score, score_breakdown, pm_notes,
      match_rank, manually_selected, timeout_at,
      volunteer_accepted_at, scholar_accepted_at,
      programs (id, name, program_type),
      scholars (
        id, cohort_year, college, current_stage, career_interests,
        sf_program_enrollment_id,
        profiles (first_name, last_name, email, sf_contact_id)
      ),
      volunteers (
        id, employer, job_title, industry, cal_booking_url,
        sf_volunteer_id,
        profiles (first_name, last_name, email)
      )
    `)
    .eq('id', match_id)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const m = match as any
  const scholar = m.scholars
  const volunteer = m.volunteers
  const program = m.programs

  // Build the payload Make.com will receive
  const payload = {
    event_type,
    match_id: m.id,
    match_status: m.status,
    ai_score: m.ai_score,
    pm_notes: m.pm_notes,
    manually_selected: m.manually_selected,
    timeout_at: m.timeout_at,
    volunteer_accepted_at: m.volunteer_accepted_at,
    scholar_accepted_at: m.scholar_accepted_at,

    // Program
    program_id: program?.id,
    program_name: program?.name,
    program_type: program?.program_type,

    // Scholar
    scholar_id: scholar?.id,
    scholar_name: `${scholar?.profiles?.first_name} ${scholar?.profiles?.last_name}`,
    scholar_email: scholar?.profiles?.email,
    scholar_sf_contact_id: scholar?.profiles?.sf_contact_id,
    scholar_sf_enrollment_id: scholar?.sf_program_enrollment_id,
    scholar_stage: scholar?.current_stage,
    scholar_college: scholar?.college,
    scholar_career_interests: scholar?.career_interests,

    // Volunteer
    volunteer_id: volunteer?.id,
    volunteer_name: `${volunteer?.profiles?.first_name} ${volunteer?.profiles?.last_name}`,
    volunteer_email: volunteer?.profiles?.email,
    volunteer_sf_id: volunteer?.sf_volunteer_id,
    volunteer_employer: volunteer?.employer,
    volunteer_job_title: volunteer?.job_title,
    volunteer_cal_booking_url: volunteer?.cal_booking_url,

    // Meta
    triggered_at: new Date().toISOString(),
    app_url: process.env.NEXT_PUBLIC_APP_URL,
  }

  console.log('Triggering Make.com webhook:', event_type, match_id)

  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const success = res.ok
    const responseText = await res.text()
    console.log('Make.com response:', res.status, responseText)

    // Log to automation_log
    await admin.from('automation_log').insert({
      event_type,
      entity_type: 'match',
      entity_id: match_id,
      triggered_by: 'system',
      payload,
      success,
      error_message: success ? null : `Make.com returned ${res.status}: ${responseText}`,
    })

    return NextResponse.json({ ok: true, make_status: res.status })
  } catch (err) {
    const message = (err as Error).message
    console.error('Make.com trigger failed:', message)

    await admin.from('automation_log').insert({
      event_type,
      entity_type: 'match',
      entity_id: match_id,
      triggered_by: 'system',
      payload,
      success: false,
      error_message: message,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
