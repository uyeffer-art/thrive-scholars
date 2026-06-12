import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

// ============================================================
// Salesforce → App: import / upsert a scholar
//
// Pulls a scholar from Salesforce into the platform so they can be
// matched. Idempotent: safe to call repeatedly for the same scholar.
//
// Because profiles.id references auth.users(id), importing a scholar
// who has never logged in requires provisioning an auth user first.
// This endpoint handles that: it finds an existing profile by email,
// or creates an auth user + profile, then upserts the scholar row.
//
// Auth: HMAC-SHA256 of the raw body using MAKE_WEBHOOK_SECRET in the
//       `x-make-signature` header (same scheme as the other SF endpoints).
//
// Body (email required; everything else optional):
// {
//   email, first_name, last_name,
//   sf_contact_id, sf_program_enrollment_id,
//   cohort_year, current_stage, college, college_grad_year,
//   career_interests: [...], first_gen, gender,
//   race_ethnicity: [...], geographic_preference
// }
// ============================================================

const SCHOLAR_FIELDS = [
  'cohort_year', 'current_stage', 'college', 'college_grad_year',
  'career_interests', 'first_gen', 'gender', 'race_ethnicity',
  'geographic_preference', 'sf_program_enrollment_id',
]

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers.get('x-make-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try { body = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const email: string | undefined = body.email?.trim?.()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const db = createAdminClient()

  // 1. Find existing profile by email
  const { data: existingProfile } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  let profileId: string

  if (existingProfile) {
    profileId = (existingProfile as any).id
    // Keep SF contact id fresh; don't downgrade an existing role.
    await db.from('profiles').update({
      sf_contact_id: body.sf_contact_id ?? undefined,
      first_name: body.first_name ?? undefined,
      last_name: body.last_name ?? undefined,
    }).eq('id', profileId)
  } else {
    // 2. Provision an auth user (no password; confirmed so they can use
    //    password-reset / invite to set one later).
    const { data: created, error: authErr } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { imported_from: 'salesforce', role: 'scholar' },
    })
    if (authErr || !created?.user) {
      await logResult(db, email, false, authErr?.message ?? 'auth user creation failed')
      return NextResponse.json({ error: authErr?.message ?? 'Could not create user' }, { status: 500 })
    }
    profileId = created.user.id

    const { error: profErr } = await db.from('profiles').insert({
      id: profileId,
      role: 'scholar',
      email,
      first_name: body.first_name ?? '',
      last_name: body.last_name ?? '',
      sf_contact_id: body.sf_contact_id ?? null,
    })
    if (profErr) {
      await logResult(db, email, false, `profile insert: ${profErr.message}`)
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }
  }

  // 3. Build the scholar payload from whitelisted fields
  const scholarPayload: Record<string, any> = { profile_id: profileId }
  for (const f of SCHOLAR_FIELDS) {
    if (body[f] !== undefined) scholarPayload[f] = body[f]
  }
  // cohort_year is NOT NULL in the schema — default if SF didn't send one
  if (scholarPayload.cohort_year === undefined) {
    scholarPayload.cohort_year = new Date().getFullYear()
  }

  // 4. Upsert the scholar row (one per profile)
  const { data: existingScholar } = await db
    .from('scholars')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  let scholarId: string
  if (existingScholar) {
    scholarId = (existingScholar as any).id
    const { profile_id, ...updateFields } = scholarPayload
    const { error } = await db.from('scholars').update(updateFields).eq('id', scholarId)
    if (error) { await logResult(db, email, false, `scholar update: ${error.message}`); return NextResponse.json({ error: error.message }, { status: 500 }) }
  } else {
    const { data: ins, error } = await db.from('scholars').insert(scholarPayload).select('id').single()
    if (error || !ins) { await logResult(db, email, false, `scholar insert: ${error?.message}`); return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 }) }
    scholarId = (ins as any).id
  }

  await logResult(db, email, true, null, { profile_id: profileId, scholar_id: scholarId, created: !existingScholar })
  return NextResponse.json({ ok: true, profile_id: profileId, scholar_id: scholarId, created: !existingScholar })
}

async function logResult(db: any, email: string, success: boolean, error: string | null, extra: Record<string, any> = {}) {
  await db.from('automation_log').insert({
    event_type: 'sf_scholar_import',
    entity_type: 'scholar',
    triggered_by: 'make_scenario',
    payload: { email, ...extra },
    success,
    error_message: error,
  })
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.MAKE_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}
