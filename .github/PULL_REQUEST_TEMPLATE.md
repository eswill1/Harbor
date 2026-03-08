## What this changes
<!-- One paragraph. What does this PR do and why? -->

## Agent
- [ ] Surface
- [ ] Algorithm
- [ ] API/Data
- [ ] Compliance Review
- [ ] Orchestrator

## Compliance Checklist
_Every PR must pass all items before merge._
_Mark each item `[x]` (confirmed not violated) or `[N/A]` (genuinely not applicable to this PR). Leave nothing as `[ ]`._

**Constitutional Guardrails**
- [ ] No infinite scroll introduced (Constitution §1)
- [ ] Deck size assertion `<= 20` present if touching deck logic (Ranking Spec red lines)
- [ ] No cross-intent ranking (Ranking Spec red lines)
- [ ] Civic content gated by opt-in (Ranking Spec red lines)
- [ ] Baseline view switcher preserved — not removed or hidden (Constitution §1, Design Bible §3.10)

**Transparency & UI**
- [ ] No red notification badges introduced (Design Bible §7)
- [ ] Source bucket pill present on any new ranked content surface (Design Bible §3.2)
- [ ] Every ranked item has explanation reason codes (Ranking Spec Stage E)
- [ ] If enforcement-adjacent: notice + appeal path present (Constitution §5)

**Algorithm & Metrics**
- [ ] No new banned optimization target introduced (Constitution §2 — no time_spent, watch_time, like_count, reshare_velocity, comment_volume)
- [ ] If material ranking change: RFC submitted and linked (Constitution §6)
- [ ] If material ranking change: rollback config versioned (Impl Plan §12)
- [ ] A/B test plan names SSR as primary metric, RR as constraint (Impl Plan §11 DoD)

**General**
- [ ] Passes arousal/manipulation audit ("can this be gamed to hijack attention?")
- [ ] Does not remove a natural stopping point
- [ ] Dark mode implemented and verified (if UI change)
- [ ] WCAG AA contrast verified (if UI change)
- [ ] Tested with reduced motion enabled (if UI change)

## RFC Link
<!-- If this is a material ranking change, link the RFC issue here. Otherwise write N/A. -->

## Test plan
<!-- How was this tested? What should the reviewer verify? -->
