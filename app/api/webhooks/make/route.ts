import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

// Make.com automation log webhook — receives events from all scenarios
// and writes them to the automation_log table.
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-make-signature')

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const { event_type, entity_type, entity_id, triggered_by, success, error_message, ...rest } = payload

  if (!event_type) {
    return NextResponse.json({ error: 'event_type required' }, { status: 400 })
  }

  const db = createAdminClient()

  await db.from('automation_log').insert({
    event_type,
    entity_type: entity_type ?? null,
    entity_id: entity_id ?? null,
    triggered_by: triggered_by ?? 'make_scenario',
    payload: rest,
    success: success !== false,
    error_message: error_message ?? null,
  })

  // Handle specific events that need DB side-effects

  if (event_type === 'sf_match_synced' && entity_id) {
    await db
      .from('matches')
      .update({ sf_match_record_id: payload.sf_record_id, sf_synced_at: new Date().toISOString() })
      .eq('id', entity_id)
  }

  if (event_type === 'match_email_sent' && entity_id) {
    await db
      .from('matches')
      .update({ match_email_sent_at: new Date().toISOString() })
      .eq('id', entity_id)
  }

  if (event_type === 'volunteer_accepted' && entity_id) {
    await db
      .from('matches')
      .update({ volunteer_accepted_at: new Date().toISOString() })
      .eq('id', entity_id)
  }

  if (event_type === 'scholar_accepted' && entity_id) {
    const { data: match } = await db
      .from('matches')
      .select('volunteer_accepted_at')
      .eq('id', entity_id)
      .single()

    const update: Record<string, string> = { scholar_accepted_at: new Date().toISOString() }
    if (match?.volunteer_accepted_at) {
      update.status = 'active'
    }
    await db.from('matches').update(update).eq('id', entity_id)
  }

  return NextResponse.json({ ok: true })
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.MAKE_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}
