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

## 5. Talking points / likely questions

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
