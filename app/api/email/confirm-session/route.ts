import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_ADDRESS } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { interactionId } = await req.json()
  if (!interactionId) return NextResponse.json({ error: 'interactionId required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: interaction, error } = await admin
    .from('interactions')
    .select(`
      id, scheduled_at, duration_minutes, program_type,
      matches(programs(name)),
      scholars(profiles(first_name, last_name, email)),
      volunteers(profiles(first_name, last_name, email))
    `)
    .eq('id', interactionId)
    .single()

  if (error || !interaction) {
    return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
  }

  const i = interaction as any
  const programName = i.matches?.programs?.name ?? 'your program'
  const scheduledDate = i.scheduled_at
    ? new Date(i.scheduled_at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'your recent session'

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/volunteer/interactions`
  const scholarConfirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scholar/interactions`

  const volunteerEmail = i.volunteers?.profiles?.email
  const scholarEmail = i.scholars?.profiles?.email
  const volunteerName = i.volunteers?.profiles?.first_name ?? 'Volunteer'
  const scholarName = i.scholars?.profiles?.first_name ?? 'Scholar'

  const emails = []

  if (volunteerEmail) {
    emails.push(
      resend.emails.send({
        from: FROM_ADDRESS,
        to: volunteerEmail,
        subject: `Did your session with ${scholarName} happen?`,
        html: `
          <p>Hi ${volunteerName},</p>
          <p>You had a <strong>${programName}</strong> session scheduled with <strong>${scholarName}</strong> on <strong>${scheduledDate}</strong>.</p>
          <p>Could you take a moment to confirm whether this session was held or missed? It helps us track progress and support both of you better.</p>
          <p style="margin: 24px 0;">
            <a href="${confirmUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
              Confirm session →
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This takes less than 30 seconds. Thank you for being a Thrive mentor!</p>
        `,
      })
    )
  }

  if (scholarEmail) {
    emails.push(
      resend.emails.send({
        from: FROM_ADDRESS,
        to: scholarEmail,
        subject: `Did your session with ${volunteerName} happen?`,
        html: `
          <p>Hi ${scholarName},</p>
          <p>You had a <strong>${programName}</strong> session scheduled with <strong>${volunteerName}</strong> on <strong>${scheduledDate}</strong>.</p>
          <p>Please confirm whether this session was held or missed so we can keep your Thrive journey on track.</p>
          <p style="margin: 24px 0;">
            <a href="${scholarConfirmUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
              Confirm session →
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This takes less than 30 seconds. Thank you!</p>
        `,
      })
    )
  }

  await Promise.all(emails)

  // Log to automation_log
  await admin.from('automation_log').insert({
    event_type: 'session_confirmation_sent',
    payload: { interaction_id: interactionId },
    status: 'success',
  })

  return NextResponse.json({ ok: true, sent: emails.length })
}
