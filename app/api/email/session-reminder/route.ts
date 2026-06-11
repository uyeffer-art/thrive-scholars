import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

// Replaces all {{merge_tags}} in a string with real values
function merge(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

export async function POST(req: NextRequest) {
  const { interactionId, templateId } = await req.json()
  if (!interactionId || !templateId) {
    return NextResponse.json({ error: 'interactionId and templateId required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch interaction with full context
  const { data: interaction } = await admin
    .from('interactions')
    .select(`
      id, scheduled_at, duration_minutes, program_type,
      matches(programs(name)),
      scholars(
        current_stage, career_interests,
        profiles(id, first_name, last_name, email)
      ),
      volunteers(
        job_title, employer, cal_booking_url,
        profiles(id, first_name, last_name, email)
      )
    `)
    .eq('id', interactionId)
    .single()

  if (!interaction) return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })

  const { data: template } = await admin
    .from('reminder_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const i = interaction as any
  const t = template as any

  const scheduledDate = i.scheduled_at
    ? new Date(i.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''
  const scheduledTime = i.scheduled_at
    ? new Date(i.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    : ''

  const mergeVars: Record<string, string> = {
    scholar_first_name:      i.scholars?.profiles?.first_name ?? '',
    scholar_last_name:       i.scholars?.profiles?.last_name ?? '',
    scholar_stage:           i.scholars?.current_stage ?? '',
    scholar_career_interests: (i.scholars?.career_interests ?? []).join(', '),
    volunteer_first_name:    i.volunteers?.profiles?.first_name ?? '',
    volunteer_last_name:     i.volunteers?.profiles?.last_name ?? '',
    volunteer_title:         i.volunteers?.job_title ?? '',
    volunteer_employer:      i.volunteers?.employer ?? '',
    volunteer_email:         i.volunteers?.profiles?.email ?? '',
    session_date:            scheduledDate,
    session_time:            scheduledTime,
    duration_minutes:        String(i.duration_minutes ?? ''),
    session_type:            (i.program_type ?? '').replace(/_/g, ' '),
    meeting_url:             i.meeting_url ?? '',
    cal_booking_url:         i.volunteers?.cal_booking_url ?? '',
    prep_content:            t.prep_content ? merge(t.prep_content, {}) : '',
  }

  // Determine recipients
  const recipients: Array<{ profileId: string; email: string; name: string }> = []

  if (t.audience === 'scholar' || t.audience === 'both') {
    if (i.scholars?.profiles?.email) {
      recipients.push({
        profileId: i.scholars.profiles.id,
        email: i.scholars.profiles.email,
        name: `${i.scholars.profiles.first_name} ${i.scholars.profiles.last_name}`,
      })
    }
  }
  if (t.audience === 'volunteer' || t.audience === 'both') {
    if (i.volunteers?.profiles?.email) {
      recipients.push({
        profileId: i.volunteers.profiles.id,
        email: i.volunteers.profiles.email,
        name: `${i.volunteers.profiles.first_name} ${i.volunteers.profiles.last_name}`,
      })
    }
  }

  const results = []

  for (const recipient of recipients) {
    // Check if already sent
    const { data: existing } = await admin
      .from('reminder_sends')
      .select('id')
      .eq('interaction_id', interactionId)
      .eq('template_id', templateId)
      .eq('recipient_profile_id', recipient.profileId)
      .single()

    if (existing) {
      results.push({ email: recipient.email, skipped: true, reason: 'already sent' })
      continue
    }

    const subject = merge(t.subject, mergeVars)
    const bodyHtml = merge(t.body_html, mergeVars)

    // Wrap in branded email shell
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dde8f0;">
          <!-- Header -->
          <div style="background:#005191;padding:20px 32px;display:flex;align-items:center;gap:12px;">
            <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Thrive</div>
            <div style="color:#61aac6;font-size:20px;font-weight:400;">Scholars</div>
            <div style="width:8px;height:8px;background:#f7b926;border-radius:50%;margin-left:2px;"></div>
          </div>
          <!-- Body -->
          <div style="padding:32px;font-size:15px;line-height:1.6;color:#102b4e;">
            ${bodyHtml}
          </div>
          <!-- Footer -->
          <div style="padding:20px 32px;border-top:1px solid #dde8f0;background:#f4f8fb;">
            <p style="margin:0;font-size:12px;color:#606673;">
              You're receiving this because you have an upcoming session through Thrive Scholars.
              Questions? Reply to this email or visit <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#005191;">${process.env.NEXT_PUBLIC_APP_URL}</a>.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      await resend.emails.send({
        from: 'Thrive Scholars <no-reply@thrivescholars.org>',
        to: recipient.email,
        subject,
        html,
      })

      await admin.from('reminder_sends').insert({
        interaction_id: interactionId,
        template_id: templateId,
        recipient_profile_id: recipient.profileId,
        status: 'sent',
      })

      results.push({ email: recipient.email, sent: true })
    } catch (err) {
      const message = (err as Error).message
      await admin.from('reminder_sends').insert({
        interaction_id: interactionId,
        template_id: templateId,
        recipient_profile_id: recipient.profileId,
        status: 'failed',
        error: message,
      })
      results.push({ email: recipient.email, sent: false, error: message })
    }
  }

  // Log to automation_log
  await admin.from('automation_log').insert({
    event_type: 'session_reminder_sent',
    entity_type: 'interaction',
    entity_id: interactionId,
    triggered_by: 'cron',
    payload: { template_id: templateId, results },
    success: results.every((r: any) => r.sent || r.skipped),
  })

  return NextResponse.json({ ok: true, results })
}
