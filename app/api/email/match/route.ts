import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_ADDRESS } from '@/lib/email/resend'
import {
  matchApprovedScholar,
  matchApprovedVolunteer,
  matchActiveScholar,
  matchActiveVolunteer,
} from '@/lib/email/templates'

// POST /api/email/match
// Body: { match_id: string, event: 'approved' | 'active' }
export async function POST(request: Request) {
  const body = await request.json()
  const { match_id, event } = body
  console.log('EMAIL API called:', { match_id, event })
  console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY, process.env.RESEND_API_KEY?.slice(0, 8))

  if (!match_id || !event) {
    return NextResponse.json({ error: 'match_id and event required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select(`
      id, pm_notes, status,
      programs (name, program_type),
      scholars (
        current_stage, college, career_interests,
        profiles (first_name, last_name, email)
      ),
      volunteers (
        job_title, employer, cal_booking_url,
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

  // In dev, Resend only allows sending to the account owner's email.
  // Override recipient emails in development so delivery actually works.
  const isDev = process.env.NODE_ENV === 'development'
  const DEV_EMAIL = 'uyeffer@gmail.com'
  const scholarEmail = isDev ? DEV_EMAIL : scholar?.profiles?.email
  const volunteerEmail = isDev ? DEV_EMAIL : volunteer?.profiles?.email

  try {
    if (event === 'approved') {
      // Email the scholar
      const scholarTemplate = matchApprovedScholar({
        scholarFirstName: scholar?.profiles?.first_name,
        volunteerName: `${volunteer?.profiles?.first_name} ${volunteer?.profiles?.last_name}`,
        volunteerTitle: volunteer?.job_title,
        volunteerEmployer: volunteer?.employer,
        programName: program?.name,
        pmNotes: m.pm_notes,
      })

      // Email the volunteer
      const volunteerTemplate = matchApprovedVolunteer({
        volunteerFirstName: volunteer?.profiles?.first_name,
        scholarName: `${scholar?.profiles?.first_name} ${scholar?.profiles?.last_name}`,
        scholarStage: scholar?.current_stage?.replace(/-/g, ' '),
        scholarCollege: scholar?.college,
        careerInterests: scholar?.career_interests ?? [],
        programName: program?.name,
        pmNotes: m.pm_notes,
      })

      const [scholarResult, volunteerResult] = await Promise.all([
        resend.emails.send({
          from: FROM_ADDRESS,
          to: scholarEmail,
          subject: scholarTemplate.subject,
          html: scholarTemplate.html,
        }),
        resend.emails.send({
          from: FROM_ADDRESS,
          to: volunteerEmail,
          subject: volunteerTemplate.subject,
          html: volunteerTemplate.html,
        }),
      ])
      console.log('Scholar email result:', JSON.stringify(scholarResult))
      console.log('Volunteer email result:', JSON.stringify(volunteerResult))

      // Mark email sent
      await admin
        .from('matches')
        .update({ match_email_sent_at: new Date().toISOString() })
        .eq('id', match_id)
    }

    if (event === 'active') {
      const scholarTemplate = matchActiveScholar({
        scholarFirstName: scholar?.profiles?.first_name,
        volunteerName: `${volunteer?.profiles?.first_name} ${volunteer?.profiles?.last_name}`,
        volunteerTitle: volunteer?.job_title,
        volunteerEmployer: volunteer?.employer,
        programName: program?.name,
        calBookingUrl: volunteer?.cal_booking_url,
      })

      const volunteerTemplate = matchActiveVolunteer({
        volunteerFirstName: volunteer?.profiles?.first_name,
        scholarName: `${scholar?.profiles?.first_name} ${scholar?.profiles?.last_name}`,
        scholarStage: scholar?.current_stage?.replace(/-/g, ' '),
        programName: program?.name,
        calBookingUrl: volunteer?.cal_booking_url,
      })

      await Promise.all([
        resend.emails.send({
          from: FROM_ADDRESS,
          to: scholarEmail,
          subject: scholarTemplate.subject,
          html: scholarTemplate.html,
        }),
        resend.emails.send({
          from: FROM_ADDRESS,
          to: volunteerEmail,
          subject: volunteerTemplate.subject,
          html: volunteerTemplate.html,
        }),
      ])
    }

    // Log to automation_log
    await admin.from('automation_log').insert({
      event_type: `match_email_${event}`,
      entity_type: 'match',
      entity_id: match_id,
      triggered_by: 'system',
      payload: { scholar_email: scholarEmail, volunteer_email: volunteerEmail },
      success: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Log failure
    await admin.from('automation_log').insert({
      event_type: `match_email_${event}`,
      entity_type: 'match',
      entity_id: match_id,
      triggered_by: 'system',
      success: false,
      error_message: (err as Error).message,
    })

    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
