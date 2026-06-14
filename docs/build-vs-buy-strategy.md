# Build vs. Buy — Strategy Notes

_Working notes on whether Thrive adopts the custom-built mentorship platform
or an established/prebuilt system for Year 1._

## The situation
- **Year-1 goal:** enroll **125 scholars** in the mentorship program.
- **Current lean:** adopt an established system rather than the custom platform.
- **Stated rationale:** time to test/set up a new (prototype-stage) system would
  pull attention away from hitting 125.
- **Your counter (current form):** buying is short-term/precautionary; custom is
  long-term and customizable; you could reach 250 faster after the initial hump.
- **Acknowledged concerns:** security of a self-run system, maintenance cost —
  real, but (your read) not the true driver.
- **Your read of the real driver:** time-to-launch + **one person's
  accountability — Nico**, who will be "on the hook."

## The core insight: you may be answering the wrong objection
The objection on the table is **risk and accountability**, not features or
ambition. A "more customizable / hit 250 faster" pitch answers an ambition
question nobody is asking — and it can **backfire**: more ambition means more
perceived risk for the person who'd own it. You don't beat a risk objection with
upside. You beat it by **removing the risk.** Reframe everything around
de-risking, not possibility.

## Honest assessment

**Where custom genuinely wins (lead with these — they're real):**
- **Total cost of ownership.** SaaS pricing scales per scholar/seat/record;
  custom has near-zero marginal cost. As you grow 125 → 250 → 500, the gap
  compounds. This is quantifiable — get the vendor's pricing and model it.
- **Exact fit.** Bespoke AI matching + multiple program types + Salesforce-linked
  case plans. Established mentorship tools often force process compromises or
  integrate weakly with your Salesforce source of truth.
- **Data ownership, native Salesforce integration, no vendor lock-in.**

**Where buy genuinely wins (acknowledge these — it buys you credibility):**
- The vendor carries **security, compliance, uptime, support, maintenance** —
  genuinely valuable for a nonprofit without dedicated engineering staff.
- **Bus factor.** A custom system depends on one builder. That's a legitimate
  organizational risk, not just fear.
- **Predictable support**, no late-night dependency.
- Keeps **Year-1 attention undivided.**

## Where the current argument is weak (fix before the meeting)
- **"Hit 250, 3x faster"** — unsupported and hype-flavored. Enrollment is gated
  by recruitment, staffing, and program capacity, not software. Software rarely
  multiplies enrollment. A skeptic will discount you for this. Reframe as:
  _"removes the per-record cost ceiling on growth,"_ which is true and defensible.
- **"Two weeks to fully running"** — optimistic. A working prototype built solo
  on late nights is not the same as production-hardening + testing + operating a
  system that holds student PII and that the org depends on. This build alone
  surfaced real RLS security holes, deployment failures, unconfigured email, and
  an unbuilt Salesforce integration — all fixable, all real work. Honest range:
  the core is built, but production-readiness (verified email domain, Salesforce
  integration, security review, data migration, staff training, monitoring,
  backups, a support process) is closer to **4–8 weeks part-time** — and
  operations are **ongoing**, not a one-time hump. Under-promising here protects
  your credibility more than the optimistic number helps it.
- **Optics.** You built it, so advocating for it looks self-interested.
  Neutralize that by openly acknowledging buy's merits and proposing an
  **objective decision gate** that lets evidence decide.

## The reframe / recommended strategy
Don't let it be an all-or-nothing call made under time pressure. Propose a path
that **protects the 125 and proves the custom system at the same time:**
1. **Protect Year 1.** Do not put the 125 goal on unproven infrastructure. Use
   the lowest-risk option to hit the number.
2. **Run custom as a controlled parallel pilot** — one program type, or a single
   cohort subset — with explicit success metrics. Proves it with zero risk to
   the goal.
3. **De-risk Nico personally — this is the actual unlock.** Put in writing: a
   named support/maintenance owner and plan, documentation, a fallback
   ("if X breaks, we revert to Y within Z hours"), and a security review. Make it
   so no single person is left holding the bag if something goes wrong.
4. **Set a decision gate.** Agree the criteria now (cost, reliability, fit,
   support burden) and let the pilot data decide at mid-year. Removes emotion and
   the self-interest optics.

## The conversation to actually have
Your persuasion target is **Nico, 1:1**, framed as _"how do I make adopting this
zero-risk for you?"_ — not a group ambition pitch. The "no" is being driven by
his perceived personal downside. Lower that, and the objection often dissolves.

## Strongest one-line framing
> "Let's not bet the 125 on either choice. Use the safe option to hit the goal,
> run mine as a parallel pilot with a clear scorecard, and decide at mid-year on
> evidence — and I'll make sure no single person is left holding the risk."
