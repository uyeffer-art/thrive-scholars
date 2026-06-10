import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_ADDRESS } from '@/lib/email/resend'

// POST /api/email/volunteer-nudge
// Body: { volunteer_id: string }
export async function POST(request: Request) {
  const { volunteer_id } = await request.json()

  if (!volunteer_id) {
    return NextResponse.json({ error: 'volunteer_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: volunteer } = await admin
    .from('volunteers')
    .select('id, last_active_at, profiles (first_name, email)')
    .eq('id', volunteer_id)
    .single()

  if (!volunteer) {
    return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
  }

  const v = volunteer as any
  const firstName = v.profiles?.first_name ?? 'there'
  const email = v.profiles?.email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thrive-scholars.vercel.app'

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `We miss you, ${firstName} — your Thrive scholars need you`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #1d4ed8;">Hi ${firstName},</h2>
          <p>We noticed it's been a while since you've been active on the Thrive Scholars platform. Your mentorship makes a real difference — and there are scholars waiting to connect with someone like you.</p>
          <p>Log in to see your current matches and upcoming sessions:</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}/volunteer/matches"
              style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View my matches →
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">If you need to pause or update your availability, you can do that from your profile page.</p>
          <p>Thanks for everything you do,<br/><strong>The Thrive Scholars Team</strong></p>
        </div>
      `,
    })

    // Update nudge timestamp and log
    await Promise.all([
      admin.from('volunteers').update({
        inactivity_nudge_sent_at: new Date().toISOString(),
      }).eq('id', volunteer_id),

      admin.from('automation_log').insert({
        event_type: 'nudge_sent',
        entity_type: 'volunteer',
        entity_id: volunteer_id,
        triggered_by: 'staff',
        payload: { email },
        success: true,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    await admin.from('automation_log').insert({
      event_type: 'nudge_sent',
      entity_type: 'volunteer',
      entity_id: volunteer_id,
      triggered_by: 'staff',
      success: false,
      error_message: (err as Error).message,
    })

    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
