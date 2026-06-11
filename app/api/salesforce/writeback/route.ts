import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

// ============================================================
// Salesforce → App writeback endpoint
//
// After a Make.com scenario creates or updates a Salesforce record,
// it calls this endpoint to store the resulting SF record IDs back
// on the matching app row. This keeps the two systems linked.
//
// Auth: HMAC-SHA256 of the raw body using MAKE_WEBHOOK_SECRET,
//       sent in the `x-make-signature` header (same scheme as
//       /api/webhooks/make).
//
// Body: {
//   entity: 'profile' | 'volunteer' | 'scholar' | 'match' | 'interaction',
//   id:     string,          // the app's row id
//   fields: { ... }          // SF id fields to store (whitelisted below)
// }
// ============================================================

// Which columns each entity is allowed to receive (prevents arbitrary writes)
const ALLOWED: Record<string, { table: string; columns: string[]; stamp?: string }> = {
  profile:     { table: 'profiles',     columns: ['sf_contact_id'] },
  volunteer:   { table: 'volunteers',   columns: ['sf_volunteer_id'] },
  scholar:     { table: 'scholars',     columns: ['sf_program_enrollment_id'] },
  match:       { table: 'matches',      columns: ['sf_match_record_id'], stamp: 'sf_synced_at' },
  interaction: { table: 'interactions', columns: ['sf_interaction_id', 'sf_case_id'], stamp: 'sf_synced_at' },
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-make-signature')

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { entity, id, fields } = payload
  if (!entity || !id || !fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'entity, id, and fields are required' }, { status: 400 })
  }

  const config = ALLOWED[entity]
  if (!config) {
    return NextResponse.json({ error: `Unknown entity "${entity}"` }, { status: 400 })
  }

  // Keep only whitelisted columns
  const update: Record<string, any> = {}
  for (const col of config.columns) {
    if (fields[col] !== undefined) update[col] = fields[col]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: `No valid fields for entity "${entity}". Allowed: ${config.columns.join(', ')}` }, { status: 400 })
  }
  if (config.stamp) update[config.stamp] = new Date().toISOString()

  const db = createAdminClient()
  const { error } = await db.from(config.table).update(update).eq('id', id)

  if (error) {
    await db.from('automation_log').insert({
      event_type: 'sf_writeback',
      entity_type: entity,
      entity_id: id,
      triggered_by: 'make_scenario',
      payload: { update },
      success: false,
      error_message: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await db.from('automation_log').insert({
    event_type: 'sf_writeback',
    entity_type: entity,
    entity_id: id,
    triggered_by: 'make_scenario',
    payload: { update },
    success: true,
  })

  return NextResponse.json({ ok: true, entity, id, updated: Object.keys(update) })
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.MAKE_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}
