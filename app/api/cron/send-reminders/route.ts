// Cron job: send session reminders — v2
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel cron calls this endpoint every hour.
// It finds all scheduled interactions where a reminder template's
// trigger window is now active, and fires the send API for each.

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // Get all active reminder templates
  const { data: templates } = await admin
    .from('reminder_templates')
    .select('*')
    .eq('is_active', true)

  if (!templates || templates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No active templates' })
  }

  // For each template, find interactions whose trigger window is now open
  // Window: scheduled_at is between (now + triggerHours - 1h) and (now + triggerHours)
  // i.e. the session falls in the 1-hour window after the trigger point
  const results = []

  for (const template of templates as any[]) {
    const triggerMs = template.trigger_hours_before * 60 * 60 * 1000
    const windowStart = new Date(now.getTime() + triggerMs - 60 * 60 * 1000).toISOString()
    const windowEnd   = new Date(now.getTime() + triggerMs).toISOString()

    // Find scheduled interactions in this window matching program_type (if set)
    let query = admin
      .from('interactions')
      .select('id, program_type')
      .eq('status', 'scheduled')
      .gte('scheduled_at', windowStart)
      .lte('scheduled_at', windowEnd)

    if (template.program_type) {
      query = query.eq('program_type', template.program_type)
    }

    const { data: interactions } = await query

    for (const interaction of interactions ?? []) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/email/session-reminder`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interactionId: interaction.id,
              templateId: template.id,
            }),
          }
        )
        const data = await res.json()
        results.push({ interactionId: interaction.id, templateId: template.id, ...data })
      } catch (err) {
        results.push({
          interactionId: interaction.id,
          templateId: template.id,
          error: (err as Error).message,
        })
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
