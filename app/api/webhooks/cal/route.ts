import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

// Cal.com webhook — fires on booking.created, meeting.ended, booking.cancelled
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-cal-signature-256')

  // Allow Cal.com ping test (sends 'no-secret-provided') and real signed requests
  const isPingTest = signature === 'no-secret-provided'
  if (!isPingTest && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const { triggerEvent, payload: data } = payload

  const db = createAdminClient()

  if (triggerEvent === 'BOOKING_CREATED') {
    const { uid, startTime, endTime, attendees, meetingUrl, metadata } = data

    // metadata.match_id must be set in the Cal.com booking link params
    const matchId = metadata?.match_id
    if (!matchId) return NextResponse.json({ ok: true })

    const { data: match } = await db
      .from('matches')
      .select('scholar_id, volunteer_id, program_type:programs(program_type)')
      .eq('id', matchId)
      .returns<{ scholar_id: string; volunteer_id: string; program_type: { program_type: string } | null }[]>()
      .single()

    if (!match) return NextResponse.json({ ok: true })

    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime()
    const durationMinutes = Math.round(durationMs / 60000)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.from('interactions').insert({
      match_id: matchId,
      scholar_id: match.scholar_id,
      volunteer_id: match.volunteer_id,
      program_type: (match as any).program_type?.program_type ?? 'coffee_chat',
      status: 'scheduled',
      scheduled_at: startTime,
      duration_minutes: durationMinutes,
      meeting_url: meetingUrl,
      cal_booking_uid: uid,
    } as any)
  }

  if (triggerEvent === 'MEETING_ENDED') {
    const { uid } = data
    await db
      .from('interactions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: 'held', held_at: new Date().toISOString(), confirmed_by: 'cal_webhook' } as any)
      .eq('cal_booking_uid', uid)
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    const { uid } = data
    await db
      .from('interactions')
      .update({ status: 'cancelled' })
      .eq('cal_booking_uid', uid)
  }

  return NextResponse.json({ ok: true })
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.CAL_COM_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  // Cal.com sends signature without 'sha256=' prefix
  return expected === signature || `sha256=${expected}` === signature
}
