# Proposal: Parallel Pilot of the Thrive Scholars Mentorship Platform

**Prepared for:** Thrive Scholars leadership
**Re:** How to evaluate the custom mentorship platform without putting the
Year-1 enrollment goal at risk

---

## Purpose

Thrive is choosing how to run mentorship operations as we scale toward **125
enrolled scholars in Year 1**. This proposal recommends a path that lets us
**protect that goal with the lowest-risk option available today** while
**evaluating the custom-built platform on evidence, not assumptions** — so the
long-term decision is made with real data and no one is asked to bet the year on
unproven infrastructure.

## Recommendation in one line

> Run Year 1 on the safest operational option, run the custom platform as a
> **scoped parallel pilot**, and make the build-vs-buy decision at **mid-year
> against an agreed scorecard.**

This is deliberately *not* an all-or-nothing choice made under time pressure.

---

## Guiding principle: the 125 goal comes first

Nothing in this proposal puts the enrollment goal at risk. The primary
operational path for Year 1 is whatever the team judges lowest-risk to hit 125.
The pilot runs *alongside* it, scoped so that if it were paused tomorrow, Year-1
operations would be unaffected.

## The proposal

**1. Protect Year 1.**
Operate the core program on the lowest-risk path so the 125 goal is never
dependent on new infrastructure.

**2. Run the custom platform as a scoped pilot.**
Limit it to a controlled slice — for example, a **single program type** (e.g.
coffee chats) or **one cohort subset** — so the test is real but contained.

**3. Measure against a shared scorecard.**
Agree the evaluation criteria up front so the decision is objective:
- **Reliability** — uptime and error rate during the pilot
- **Fit** — does it match Thrive's actual mentorship + Salesforce workflow
- **Cost of ownership** — projected cost at 125 → 250 → 500 scholars vs. the
  established system's pricing at the same scale
- **Support burden** — hours/week to operate and maintain
- **User experience** — scholar, volunteer, and staff feedback

**4. Remove single-person risk (so no one is "on the hook").**
Before the pilot starts, put in writing:
- A **named support owner** and a simple maintenance plan
- **Documentation** of the system and its operations
- A **written fallback** — if a defined failure occurs, revert to the primary
  path within a set timeframe
- A **security review** of data access and storage

**5. Decide at the mid-year gate.**
At the agreed checkpoint, review the scorecard and make a clear go / no-go /
extend decision. Evidence decides — not optimism, and not fear.

---

## Why this is the right structure

- **It de-risks the decision itself.** Leadership commits to a small, reversible
  pilot, not a platform migration.
- **It protects the team's focus.** Year-1 attention stays on enrollment; the
  pilot is scoped to avoid pulling the org off-target.
- **It surfaces the real numbers.** Build-vs-buy is ultimately a cost, fit, and
  risk question. A pilot produces actual data on all three.
- **It preserves optionality.** Choosing the established system now is hard to
  reverse later; a pilot keeps both doors open at low cost.

## Honest framing of the trade-offs

- **In favor of buying:** an established vendor carries security, uptime,
  support, and maintenance — real value for a nonprofit without dedicated
  engineering staff. This proposal does not dispute that; it simply asks that the
  comparison be made on evidence.
- **In favor of the custom platform:** it fits Thrive's exact workflow (bespoke
  matching, multiple program types, native Salesforce/case-plan integration) and
  carries near-zero per-scholar cost, so the economics improve as we grow. The
  pilot is how we test whether that potential is real and operable here.

The point of the pilot is to let those trade-offs be **weighed with data** before
a long-term commitment.

---

## Current state of the platform (context)

The custom platform is already built and deployed, covering the full mentorship
lifecycle: scholar/volunteer profiles, AI-assisted matching with staff approval,
scheduling, session tracking and feedback, training, automated reminders, a
staff console, and Salesforce-ready data flows. Access is enforced at the
database with row-level security (verified by testing).

Two items require Thrive-side access to operate at full scale, and would be the
pilot's setup tasks:
1. **Email domain** — verify a Thrive sending domain so notifications reach
   scholars and volunteers.
2. **Salesforce connection** — API access and the object model so records sync to
   the case plan. The platform's sync endpoints are already built.

## The ask

Approval to run a **scoped, time-boxed parallel pilot** with:
- An agreed pilot scope (program type or cohort subset)
- The shared scorecard above
- The risk-mitigation commitments in place before launch
- A mid-year decision gate

This costs Thrive very little, risks nothing against the 125 goal, and replaces a
high-stakes guess with a low-stakes, evidence-based decision.
