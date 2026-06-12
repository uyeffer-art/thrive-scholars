# Salesforce Integration — Build Guide

This document explains how to connect the platform to Salesforce. The app
side is **fully built**; what remains is configuring the Make.com scenarios
and providing Salesforce credentials. Hand this to whoever has Salesforce +
Make.com access.

---

## How the integration works (architecture)

```
                  match/interaction changes
   App  ───────────────────────────────────────►  Make.com
   │     POST /api/automation/trigger                 │
   │     (rich JSON payload, already built)           │  creates/updates
   │                                                  ▼  Salesforce records
   │                                            Salesforce
   │                                                  │
   │     POST /api/salesforce/writeback               │  returns SF record IDs
   ◄──────────────────────────────────────────────────┘
         (stores sf_*_id back on the app row)
```

Two halves, both already coded on the app side:

1. **Outbound** — `POST /api/automation/trigger` fires whenever a match
   changes state and sends Make.com a full payload (scholar, volunteer,
   program, all current SF IDs). *Already built.*
2. **Writeback** — `POST /api/salesforce/writeback` receives the SF record
   IDs that Make.com creates and stores them on the app row. *Already built.*

**What's left:** the Make.com scenarios in the middle that actually talk to
Salesforce.

---

## App endpoints reference

### Outbound trigger (app → Make)
`POST https://thrive-scholars.vercel.app/api/automation/trigger`
Already called internally on match changes. Payload includes:
`event_type, match_id, match_status, scholar_*, volunteer_*, program_*`,
plus existing `scholar_sf_contact_id`, `scholar_sf_enrollment_id`,
`volunteer_sf_id`.

### Writeback (Make → app)
`POST https://thrive-scholars.vercel.app/api/salesforce/writeback`

**Auth:** header `x-make-signature` = HMAC-SHA256 of the raw request body,
keyed with `MAKE_WEBHOOK_SECRET` (already set in Vercel env). In Make.com,
use the *Create HMAC* tool or set the signature in a custom module.

**Body:**
```json
{
  "entity": "profile | volunteer | scholar | match | interaction",
  "id": "<the app row id>",
  "fields": { "<sf field>": "<value>" }
}
```

**Allowed fields per entity** (anything else is ignored):
| entity | fields you may send |
|---|---|
| `profile` | `sf_contact_id` |
| `volunteer` | `sf_volunteer_id` |
| `scholar` | `sf_program_enrollment_id` |
| `match` | `sf_match_record_id` (auto-stamps `sf_synced_at`) |
| `interaction` | `sf_interaction_id`, `sf_case_id` (auto-stamps `sf_synced_at`) |

Example:
```json
{ "entity": "match", "id": "53d7a6c9-…", "fields": { "sf_match_record_id": "a0X5f000001AbcDEF" } }
```

---

## Make.com scenarios to build

### Scenario 0 — Import scholars (Salesforce → app)
Scholars are existing Thrive participants, so they're imported, not self-registered.

**Trigger:** scheduled scan (e.g. nightly) of scholars enrolled in / eligible
for a mentorship program, or fire when staff flags a scholar in Salesforce.

**Step:** **HTTP → POST** `https://thrive-scholars.vercel.app/api/salesforce/import-scholar`
with HMAC `x-make-signature`. Body (email required):
```json
{
  "email": "scholar@example.com",
  "first_name": "Jordan", "last_name": "Thompson",
  "sf_contact_id": "003...", "sf_program_enrollment_id": "a0X...",
  "cohort_year": 2025, "current_stage": "college-2",
  "college": "University of Iowa",
  "career_interests": ["Finance"], "first_gen": true
}
```
The endpoint is **idempotent** (safe to re-run): it finds the scholar by email
or provisions a login + profile, then upserts the scholar record. Recommended:
import only **program-scoped** scholars, not the entire scholar base.

### Scenario 1 — Sync Contacts (scholars & volunteers)
**Trigger:** Custom webhook receiving the `/api/automation/trigger` payload
(or a scheduled scan of the Salesforce status dashboard).

**Steps:**
1. **Router** on whether `scholar_sf_contact_id` / `volunteer_sf_id` is empty.
2. **Salesforce → Search Contact** by email.
   - If found → use that Contact Id.
   - If not found → **Salesforce → Create Contact** (map name, email, role).
3. **HTTP → call writeback** with `entity: "profile"`, `id: <scholar/volunteer profile_id>`,
   `fields: { sf_contact_id: <Contact Id> }`.

### Scenario 2 — Sync Matches
**Trigger:** `/api/automation/trigger` with `event_type` in
`approved | active | completed`.

**Steps:**
1. **Salesforce → Upsert** a `Mentorship_Match__c` (or your custom object),
   mapping: scholar Contact, volunteer Contact, program, status, AI score.
2. **HTTP → writeback** `entity: "match"`, `id: match_id`,
   `fields: { sf_match_record_id: <record Id> }`.

### Scenario 3 — Sync Interactions
**Trigger:** an app event when an interaction is marked **held** (add a
trigger call in the "mark held" path, or scan held interactions on a
schedule).

**Steps:**
1. **Salesforce → Create** an Activity / `Interaction__c` linked to the
   scholar's Case (`sf_case_id`), with date, type, duration, ratings.
2. **HTTP → writeback** `entity: "interaction"`, `id: interaction_id`,
   `fields: { sf_interaction_id: <Id>, sf_case_id: <Case Id> }`.

---

## What you need from Thrive Scholars / Salesforce admin
- A **Connected App** (OAuth) or API user for Make.com's Salesforce connection.
- The **object + field model**: which objects represent Contacts, Program
  Enrollments, Matches, and Interactions, and the API field names.
- Confirmation of the **Case** object used for a scholar's case plan
  (for `sf_case_id`).

## What's already done on the app side
- ✅ All `sf_*` columns exist in the database.
- ✅ Outbound trigger endpoint sends full context to Make.com.
- ✅ Writeback endpoint stores SF IDs (with HMAC auth + audit logging).
- ✅ Staff **Salesforce** dashboard shows what's linked vs. pending.
- ✅ Every writeback is recorded in the **automation log**.
