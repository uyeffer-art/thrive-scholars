# Thrive Scholars Mentorship Platform — Walkthrough

**Prepared for the Thrive Scholars review meeting**
Live app: **https://thrive-scholars.vercel.app**

This guide does two things:
1. Maps the **original spec** to what the platform now does (coverage table).
2. Gives you a **click-through demo script** to run live in the meeting.

---

## 1. The 60-second pitch

Thrive Scholars now has an end-to-end mentorship platform that takes a scholar
from **sign-up → AI match → scheduled sessions → tracked outcomes**, with a
full staff console to manage every step and automations that keep Salesforce
and email in sync.

Three roles, three tailored experiences:
- **Scholars** — see their match, book sessions, complete prep, track progress.
- **Volunteers** — accept a mentee, share availability, run and log sessions.
- **Staff/PM** — review and approve matches, manage programs, monitor everything.

---

## 2. Spec coverage

| Original requirement | Status | Where to see it |
|---|---|---|
| Scholar & volunteer profiles (identity, interests, career, alma mater) | ✅ Built | Profile pages; staff detail pages |
| AI-powered matching with tunable weights | ✅ Built | Staff → Programs (weights); Scholar → "Run matching" |
| Multiple program types (mentorship year, coffee chat, mock interview, resume review) | ✅ Built | Staff → Programs |
| PM review & approval workflow | ✅ Built | Staff → Matches (approve / resend / cancel) |
| Two-sided accept / decline | ✅ Built | Scholar & Volunteer → My Matches |
| Match timeout & escalation | ✅ Built | Staff → Matches (timeout banners, Timed-Out tab) |
| Scheduling (Cal.com) | ✅ Built | Volunteer booking link → sessions appear automatically |
| Interaction tracking (held/missed, ratings, notes) | ✅ Built | Sessions pages (all roles) + Staff → Interactions |
| Self-service session confirmation + reminders | ✅ Built | Sessions pages; automated daily reminder emails |
| Training / prep content per audience & program | ✅ Built | Training pages; includes Summer Academy video |
| Session prep guidance & custom comms | ✅ Built | Staff → Reminders (templates + prep cards) |
| Corporate partner & star-volunteer tracking | ✅ Built | Staff → Volunteer detail (actions panel) |
| Inactivity nudges | ✅ Built | Staff → Volunteers (inactivity banner + nudge email) |
| Salesforce sync (contacts, matches, interactions → case plan) | 🟡 App-ready | Staff → Salesforce dashboard; needs SF credentials + Make scenarios |
| Email comms (notifications, reminders, password reset) | 🟡 App-ready | Works in test mode; needs verified sending domain |
| Automation audit trail | ✅ Built | Staff → Automation Log |

> 🟡 = fully built on our side; needs **their** credentials/access to go live
> (Salesforce org + email domain). Nothing more to code — it's a connect step.

---

## 3. Live demo script

> Tip: open three browser profiles/incognito windows so you can stay logged
> in as Staff, Scholar, and Volunteer simultaneously.
> Staff login: **`uyeffer+staff@gmail.com`** / **`Thrive2026!`**
> Scholar & volunteer demo accounts use **`ThriveTest123!`**

### Part A — Staff console (the control center)
Log in as **`uyeffer+staff@gmail.com`** (password **`Thrive2026!`**).

1. **Dashboard** — high-level overview.
2. **Scholars / Volunteers** — browse records; open one to show the rich
   profile, embedding status, and (for volunteers) the **actions panel**:
   corporate-partner flag, star volunteer, inactivity nudge.
3. **Programs** — show the four program types and the **matching weight
   sliders** (career / identity / geography / alma mater / engagement). This is
   the "tunable AI matching" requirement.
4. **Run a match** — from a scholar's page, generate AI match suggestions,
   then **approve** one. Point out resend / cancel and the email-sent status.
5. **Matches** — show status tabs and the **timeout escalation** banners.
6. **Interactions** — show held/missed management and the "send reminder" action.
7. **Reminders** — open a template; show merge tags + the in-app prep content.
8. **Salesforce** — the sync dashboard: what's linked vs. pending.
9. **Automation Log** — every automated event, for audit/debugging.

### Part B — Scholar experience
Log in as **`jordan@test.com`**.

1. **Home dashboard** — welcome, **getting-started checklist** (profile →
   training → accept match → book session), stats, and "how mentorship works."
2. **My Matches** — review the matched mentor, **accept**, then **book a
   session** via the mentor's link.
3. **Sessions** — show the **prep card** for an upcoming session, and the
   **held/missed self-confirmation** + rating flow.
4. **Training** — the Summer Academy video and completion tracking.
5. **Profile** — the full editable scholar profile.

### Part C — Volunteer experience
Log in as **`priya.patel@test.com`**.

1. **My Matches (landing)** — the **mentor getting-started checklist**,
   upcoming sessions, and "how mentoring works."
2. **Accept a match**, show the booking-link reminder.
3. **Sessions** — prep card + confirm/rate flow from the mentor side.
4. **Training** — volunteer modules.
5. **Profile** — availability, programs, booking link.

### Part D — The automations (explain, with proof in the log)
- **Email:** branded match notices, **daily session reminders** with prep
  content, confirmation prompts, password reset. (Show a sent reminder.)
- **Salesforce:** outbound trigger + writeback endpoint are built; the
  Automation Log shows events flowing.

---

## 4. What's needed to go fully live

Be upfront and concrete — these are **access**, not engineering:

1. **Email domain** — verify a Thrive sending domain in Resend (DNS records),
   then auth + app email deliver to real users. *(~20 min once DNS access exists.)*
2. **Salesforce** — a connected app / API user + their object model, so the
   Make.com scenarios can read/write real records. The app endpoints are ready.

Everything else is built, deployed, and working today.

---

## 5. Security & data privacy

The platform handles scholar PII (including demographic data), so security was
built in from the data layer up. Lead with this framing: **access is enforced
at the database, not just hidden in the UI.**

### How the platform protects data
- **Authentication** — Supabase Auth (industry standard). Passwords are
  hashed (never stored or seen in plaintext); sessions use signed JWTs;
  password resets use single-use, time-limited links.
- **Authorization (Row Level Security)** — every table has Postgres RLS
  policies. Scholars can read only their own records; volunteers see only
  their match context (not other scholars' data); staff/admin access is
  gated by a server-side role check. Even a compromised browser session
  cannot read another user's data — the database refuses it. **Verified by
  testing:** attempts to read or modify another user's records are rejected
  at the database.
- **Least-privilege secrets** — the powerful service-role key and all API
  keys live only in encrypted server-side environment variables, never in
  the browser. The client uses only the public, RLS-gated key.
- **Transport & hosting** — HTTPS/TLS everywhere (Vercel). Data lives in
  managed Postgres (Supabase) — encrypted at rest and in transit, with
  automated backups.
- **Automation & webhooks** — inbound webhooks (Make.com, Salesforce
  writeback) are verified with HMAC-SHA256 signatures; the scheduled job is
  protected by a secret. Spoofed automation calls are rejected.
- **Salesforce exchange** — only record IDs are passed back and forth over
  an authenticated channel; there's no open endpoint dumping PII.
- **Audit trail** — the automation log records every automated action and
  its success/failure for review.

### Who can see what
| Data | Scholar | Volunteer | Staff/Admin |
|---|---|---|---|
| Own profile | ✅ | ✅ | ✅ |
| Other scholars' PII / demographics | ❌ | ❌ | ✅ |
| Matched partner's basic context | ✅ | ✅ (match only) | ✅ |
| All matches / interactions / logs | ❌ | ❌ | ✅ |

### Security questions you may get
- **"Where is our data and is it encrypted?"** Managed Postgres on Supabase
  (built on AWS) — encrypted at rest and in transit (TLS), with automated
  backups.
- **"Who can see a scholar's personal information?"** Only the scholar and
  authorized staff. Enforced by database-level Row Level Security, not just
  the interface. Volunteers never see other scholars' data.
- **"How are passwords handled?"** Hashed by Supabase Auth — we never store
  or see plaintext. Resets use expiring, single-use links.
- **"What about the demographic data (race, gender, first-gen)?"** It powers
  matching and is access-controlled like all PII; any field can be made
  optional or omitted per your policy.
- **"Is the Salesforce connection secure?"** Yes — HMAC-authenticated,
  ID-only exchange; no open data endpoints.
- **"What if an API key is exposed?"** Keys are environment-scoped, server-
  side only, and rotatable without code changes.
- **"Is this FERPA-aware?"** The access model supports FERPA-style data
  minimization and need-to-know access; we recommend a formal review with
  your compliance team before broad rollout.

### Honest hardening roadmap (recommended before broad launch)
Be upfront that these are sensible next steps, not gaps that block a pilot:
- Enable **multi-factor authentication** for staff/admin accounts (supported).
- Finish **verified email domain + custom SMTP** (already in progress).
- Add a **data-retention & deletion policy** and document it.
- Commission a **third-party security review / penetration test** before
  scaling to full production.
- Define **backup-restore drills** and an incident-response contact.

---

## 6. Talking points / likely questions

- **"Is the matching real AI?"** Yes — scholar & volunteer profiles are
  embedded (OpenAI), scored against tunable per-program weights, then surfaced
  for PM approval. Humans stay in the loop.
- **"What about data in Salesforce?"** The schema already carries SF IDs on
  every relevant record, the dashboard tracks sync status, and the writeback
  endpoint is live. We just need their org credentials to flip it on.
- **"Can staff customize the comms?"** Yes — reminder templates are fully
  editable (timing, audience, program, merge tags, prep content) without a deploy.
- **"How do we know sessions actually happened?"** Both parties self-confirm
  held/missed, staff can override, and everything is rated and logged.

---

## 7. Salesforce intake & data flow (discussion)

Recent update: the app side of the Salesforce connection is now fully built —
both the outbound trigger and the inbound scholar-import endpoint. What remains
is configuring Make.com and confirming their data model. Use this to frame the
intake conversation.

### Talking points
- **Two systems, clear roles** — Salesforce is the system of record (scholars,
  enrollments, case plans); the platform is the system of engagement (matching,
  scheduling, sessions, comms). The `sf_*` ID fields keep them linked.
- **Volunteers register on the platform** — they sign up and onboard here (low
  friction, and we capture exactly what matching needs); Make.com then finds or
  creates their Salesforce Contact and writes the IDs back.
- **Scholars are imported from Salesforce** — they're existing Thrive
  participants, so we pull them in rather than re-register them. A new, secure,
  idempotent import endpoint provisions a login + profile and upserts the
  scholar record (safe to re-run nightly).
- **Recommendation: import program-scoped scholars**, not the entire scholar
  base — keeps the matching pool relevant and the PII footprint minimal.
- **Both directions are coded and dormant** until connected — turning it on is a
  Make.com configuration step, not new development.

### Questions to cover with Thrive
- Should scholars be imported **all** or **program/cohort-scoped**? (Recommend scoped.)
- What **triggers** a scholar import — a nightly sync, or when staff flag a
  scholar for mentorship in Salesforce?
- Are any **volunteers recruited in Salesforce first** (so we'd also add a
  volunteer-import path), or always via the platform?
- Which Salesforce **objects and fields** represent scholar enrollment and the
  case plan we attach interactions to?
- How should imported scholars **get their login** — an invite email, or a
  "set your password" link on first contact?
- Who provides the **Salesforce API credentials / connected app**, and who owns
  the Make.com scenarios?
