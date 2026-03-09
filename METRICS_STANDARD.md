# Harbor Metrics Standard
### Version 0.2 — Aligned with Constitution v0.2 (includes Perspective §11), Ranking Spec v0.2

---

## Purpose

This document defines the metrics Harbor uses to:

- Keep the product aligned with finishable, intent-first, non-addictive social
- Evaluate algorithm and UX changes safely
- Trigger automatic rollback when drift appears
- Report transparently — internally and in public transparency reports

This standard assumes the Harbor Anti-Drift Constitution is the source of truth for what the system is allowed to optimize.

---

## Metric Tiers and What They're Allowed to Do

### Tier 0: Constitutional Guardrails

These are hard constraints, not KPIs.

- Deck finiteness
- Intent boundaries (no cross-intent optimization)
- Arousal ceilings and serendipity budgets
- Civic opt-in separation rules

**Tier 0 items must be enforced mechanically, not watched.**

### Tier 1: Primary Success Metrics

These are the only metrics Harbor is allowed to optimize directly.

- Satisfied session
- Usefulness and relationship value (non-viral)
- User agency and trust (control, clarity, low regret)

### Tier 2: Safety and Health Metrics

Monitored as constraints. If they worsen beyond thresholds, changes fail or roll back.

- Regret, negative mood shifts
- High-arousal exposure
- Toxicity and dogpile dynamics
- Moderation fairness and appeal outcomes

### Tier 3: Operational and Sustainability Metrics

Diagnostic and budget-driving, not optimization targets.

- Infrastructure cost per active user
- Support load, mod queue time
- Retention (reported, but never chased via dark patterns)

---

## Definitions: Core Entities

**Session**
Starts when the app becomes active. Ends after 30 minutes of inactivity or explicit exit.

**Deck**
A finite set of items generated for a specific intent surface (example: 20 cards). A deck is "completed" when the user reaches the final card.

**Exposure**
An item counts as exposed when it is on screen for at least:
- 1.0 second for text/image cards
- 2.0 seconds for link previews

Adjustable by content type, but fixed platform-wide.

**High-arousal item**
An item whose Arousal Score falls in the "high" band (defined below).

---

## Tier 1: Primary Success Metrics

### 1. Satisfied Session Rate (SSR)

**What it is**
Percent of sessions where the user reports "Yes" to "Did you get what you came for?"

**How it's collected**
Lightweight prompt shown at deck completion, or when the user exits after viewing at least 5 items, or after 8 minutes — whichever comes first. Sampling: shown to 20–40% of sessions to avoid prompt fatigue, with rotating cohorts.

**Definition**
```
SSR = sessions with "Yes" / sessions with a response
```

**Required breakdowns**
- By intent (Catch Up / Connect / Learn / Create / Delight / Civic)
- By new vs. returning user
- By deck number (first deck vs. chained decks)

SSR is the closest thing Harbor has to a north star metric.

---

### 2. Partial Satisfaction Rate (PSR)

**What it is**
Percent of prompted sessions where the user answered "Sort of."

**Use**
Diagnostic for where the product is nearly meeting intent but failing in specifics.

---

### 3. Usefulness Yield (UY)

**What it is**
How often users take "I want this later" actions.

**Definition (deck-level)**
```
UY = (saves + adds-to-shelf + bookmarks + "helpful" marks) / exposures
```
(Reported per 100 exposures for readability.)

**Required breakdowns**
- By intent and shelf category
- By source type (friends, groups, creators, discovery)

**Guardrail note**
UY is allowed as a primary metric only because it rewards value, not arousal.

---

### 4. Relationship Value Index (RVI)

**What it is**
A measure of meaningful interaction with real relationships.

**Definition (session-level)**
RVI is a weighted count of:
- Replies to friends (not just reactions)
- Comments exceeding a minimum length threshold (example: >120 chars) or containing a question
- Direct shares to a person or small group
- Event participation actions (RSVP, poll vote, volunteer sign-up)

**Not included in RVI**
- Raw like/reaction volume
- Reshare/broadcast count

Primarily for Catch Up and Connect.

---

## Tier 2: Safety and Health Metrics

### 5. Regret Rate (RR)

**What it is**
Percent of prompted sessions where the user indicates they regret opening Harbor.

**Prompt**
"Do you wish you hadn't opened Harbor just now?" (Yes / No)

**Definition**
```
RR = sessions with "Yes" / sessions with a response
```

RR going up is the clearest early warning of doomscroll drift.

---

### 6. Mood Delta (MD)

**What it is**
Optional, privacy-sensitive, self-reported mood change.

**Prompt**
"How do you feel after this session?" (Better / Same / Worse)

**Tracked as**
- Worse Rate (WMR): % "Worse"
- Better Rate (BTR): % "Better"

**Use**
Strictly a constraint and research measure. Never used to personalize individuals.

**Privacy rule**
Mood prompts must be opt-in and never shown to minors.

---

### 7. Deck Chaining Rate (DCR)

**What it is**
How often users load additional decks in a session.

**Definition**
Average decks per session, plus distribution percentiles.

**Compulsion proxy**
Track "rapid chaining": % of sessions loading 3+ decks within 10 minutes.

DCR is not bad by itself. It's a drift detector when paired with regret and arousal exposure.

---

### 8. Arousal Exposure Index (AEI)

**What it is**
How much high-arousal content users are exposed to.

**Arousal Score bands**

| Band | Range |
|---|---|
| Low | 0.00–0.33 |
| Medium | 0.34–0.66 |
| High | 0.67–1.00 |

**AEI reporting**
- % of exposures in the high band
- % of decks exceeding the high-arousal fraction cap (should be near zero if enforcement works)
- Max consecutive high-arousal items in a deck

**Hard constraints**
- High-arousal exposures per deck must remain under a fixed cap (example: ≤10%)
- No more than 1 high-arousal item consecutively in default surfaces

**Calibration and audit**
- Monthly human-labeled calibration set
- Quarterly drift audit (false positives/negatives)
- Simplified methodology published in transparency reports (without revealing spam-evasion details)

---

### 9. Toxicity and Dogpile Indicators

| Metric | Definition |
|---|---|
| Hostile Reply Rate (HRR) | % of replies flagged as hostile by classifier or community reporting (with audit) |
| Unique Piler Count (UPC) | Unique accounts replying critically to a single target within a short window |
| Dogpile Velocity (DV) | Rate of hostile replies per minute after a post begins to spike |

**Constraint**
If DV crosses threshold, the system triggers dampening automatically: rate limits, distribution reduction, context prompts.

---

### 10. Moderation Fairness and Process Metrics

| Metric | Definition |
|---|---|
| Notice Coverage Rate | % of reach-impacting actions that generate a clear user notice |
| Appeal Rate | % of actions appealed |
| Appeal Overturn Rate | % of appealed actions overturned |
| Time to Decision | Median and p95 for appeal resolution |
| False Positive Review Rate | Sampled audit of enforcement correctness |

**Constraint**
High overturn rate combined with high volume indicates systemic error. Related automation must halt until fixed.

---

## Tier 3: Operational and Sustainability Metrics

### 11. Cost per Active User (CPAU)
All-in infrastructure cost per monthly active user, and per daily active user.

### 12. Moderator Load
Queue size, median time to first review, p95, automation precision/recall estimates from audits.

### 13. Support Burden
Tickets per 1,000 users, top complaint categories (especially "I can't understand why I'm seeing this").

These metrics inform staffing and architecture, not ranking.

---

## Experiment and Release Gating

### What Counts as a Material Change

Any change to:
- Ranking objective weights
- Allowed or disallowed signals
- Arousal or serendipity caps
- Default feed or surface composition
- Civic lane boundaries
- Friction thresholds for amplification
- Visibility or notice behavior for enforcement
- Messaging or notification defaults, batching thresholds, quiet hours, or indicator behavior (Constitution §9, Design Bible §8)
- Perspective rater sources (adding, removing, or changing a rater)
- Perspective reliability tier mapping logic (how rater ranges collapse to tier labels)
- Perspective framing grouping methodology (how L/C/R is derived from rater data)
- Perspective data versioning (`data_version` bump) — must be accompanied by an RFC per Constitution §11

Material changes require the RFC process and formal evaluation below.

### Evaluation Protocol for Material Changes

**Required experimental design**
- Randomized controlled experiment with holdout
- Minimum runtime: 7 days (14 preferred) to capture habit effects
- Minimum sample: sized via power analysis to detect small changes in regret and satisfaction

**Required metrics to pass**

A change may only ship globally if all of the following hold:

| Metric | Gate |
|---|---|
| SSR | Non-decrease beyond tolerance |
| RR | Non-increase beyond tolerance |
| WMR | Non-increase beyond tolerance (if collected) |
| AEI | Non-increase beyond tolerance |
| Dogpile indicators | Non-worsening |
| Notice coverage | Non-worsening |
| Appeal health | Non-worsening |

---

## Messaging and Notification Metrics

Messaging and notification changes are treated as material changes and must pass the same gating and rollback standards as ranking changes (Constitution §9, Design Bible §8).

### Required Tracked Metrics

Any messaging or notification UX change must be evaluated against, at minimum:

| Metric | Why |
|---|---|
| Regret Rate (RR) | Primary compulsion signal |
| Satisfied Session Rate (SSR) — overall and by intent | Check for indirect distraction effects |
| Deck Chaining Rate (DCR) — especially rapid chaining (3+ decks/10 min) | Compulsive app-open proxy |
| Worse Mood Rate (WMR) | If collected (opt-in cohort) |
| Arousal Exposure Index (AEI) | Ensure messaging doesn't indirectly drive higher-arousal consumption |

### Ship Gates for Notification Changes

A messaging or notification change cannot ship globally if it causes (vs. control/holdout):

| Metric | Block Threshold |
|---|---|
| RR increase | > 5% relative |
| SSR decrease | > 2% relative |
| Rapid deck chaining increase | > 20% relative (especially if RR increases at all) |
| Worse mood increase | > 5% relative (if measured) |
| AEI high-band exposure increase | > 5% relative |

### Hard Constraints for Notification Design

Messaging notifications and indicators must not be designed or tuned to increase:
- Session frequency
- Time spent
- Compulsive checking behavior (proxy: rapid app opens immediately following push notifications)

Any increase in these proxies must be treated as a drift signal and investigated before shipping.

### Auto-Rollback Triggers (Messaging-Specific)

If a messaging or notification change produces, sustained for 2+ hours vs. baseline:
- RR ≥ 15% relative increase, **or**
- Rapid app opens immediately following pushes, coupled with any RR increase

…then the change must automatically roll back and be re-reviewed.

### Transparency Requirement

Any material change to messaging or notification behavior (defaults, batching thresholds, quiet hours, dot behavior, priority contact limits) must be documented in:
- An internal RFC, **and**
- A user-facing change note ("what changed and why") when shipped.

---

## Perspective Metrics

Perspective is a purely informational context layer — it is not a ranking input and not a content moderator. Metrics here fall into three categories: **firewall compliance** (constitutional, must be 100%), **user experience impact** (safety gates for rollout), and **data quality** (operational health).

### Perspective Firewall Compliance (Tier 0)

This is a constitutional constraint, not a KPI. It must be mechanically enforced and verified on every deploy.

| Metric | Target | Action if violated |
|---|---|---|
| Prohibited feature appearance rate | 0% — any Perspective table field appearing in a ranking model feature set | **Immediate rollback** + incident report + constitutional review (Ranking Spec §10.2) |
| Framing gate compliance | 100% — `framing_direction` must never be returned to non-Civic users | Immediate rollback of the API change |
| Rater attribution presence | 100% — every reliability display must name the raters and update date | Ship-block until fixed |

These are enforced via:
- Nightly automated audit (feature importance log scan)
- API-level test: confirm `framing_direction` is null for responses to non-Civic users
- E2E test on every deploy: fetch Perspective panel as non-Civic user, assert no framing fields present

### Perspective Rollout Impact (Tier 2)

When Perspective panels are introduced (Phase 2), evaluate against the following gates before global ship. These use the same tolerances as general ranking changes.

**Measured in Civic Lane users only (where full Perspective is shown):**

| Metric | Gate |
|---|---|
| Civic SSR | Non-decrease beyond -2% relative vs. Civic-without-Perspective control |
| RR (Civic users) | Non-increase beyond +5% relative |
| Worse Mood Rate (Civic, if collected) | Non-increase beyond +5% relative |

**Rationale:** If showing reliability context or coverage dots causes Civic users to feel more anxious or dissatisfied — rather than more informed — that is a design failure, not just a metric miss. Investigate qualitatively before shipping globally.

**For non-Civic users (reliability context only — collapsed by default):**

| Metric | Gate |
|---|---|
| SSR across all intents | Non-decrease beyond -2% relative |
| RR | Non-increase beyond +5% relative |

The collapsed default minimizes impact outside Civic, but any degradation must be investigated.

### Perspective Data Quality (Tier 3)

These are operational diagnostics. They inform data pipeline health and rater update cadence, not ranking.

| Metric | Definition | Target |
|---|---|---|
| Outlet coverage hit rate | % of news link cards that resolve to a known outlet in `perspective_outlets` | Track over time; no hard target initially — use to inform outlet seeding |
| Rater data freshness | Days since `rater_updated_at` for the outlet set | Alert if any outlet's data is >90 days stale |
| Mapping error correction rate | % of outlet domain-mapping dispute reports that result in a verified correction | Track; high rate indicates domain normalization problems |
| Civic lens adoption | % of Civic users who have set a non-"all" lens preference | Informational only — never optimized |
| Cross-coverage reader open rate | % of Perspective panel opens that result in "Read cross-coverage" tap | Informational — helps size the cross-coverage index |
| Panel open rate | % of news link card exposures where user opens the Perspective panel | Informational — adoption signal |

**Important:** Panel open rate and lens adoption are tracked for product health only. Harbor must never optimize to increase these numbers — that would turn the transparency layer into an engagement feature.

### Perspective Rollback Triggers

**Immediate rollback:**
- Any confirmed violation of the Perspective firewall (prohibited signal in ranking or framing data returned to non-Civic user)
- Civic SSR decreases ≥15% relative, sustained 2+ hours, after a Perspective change

**Fast rollback (within 24 hours):**
- Civic SSR decreases ≥5% relative, sustained over a full day
- RR increases ≥10% relative in Civic users after a Perspective change

**Manual review required (no auto-ship):**
- Any Perspective data version bump (`data_version` change) — must complete RFC process first
- Rater source changes that cause reliability tier reclassification for >1% of known outlets

---

## Broadcast Pause / Share Friction Metrics

Share friction is a **material UI change** subject to the same rollback discipline as ranking changes. The specific risk is the **backfire effect**: a friction UI that increases desire for or engagement with flagged content rather than reducing harm.

### Backfire Detection (Tier 2 — measure on every friction UI change)

Evaluate against the following after any change to the Broadcast Pause module or arousal flagging logic. Measure flagged-content items vs. the same items in a pre-change baseline or holdout.

| Metric | What a backfire looks like | Action threshold |
|---|---|---|
| **Consumption uplift on flagged items** | Views/exposures on flagged cards increase vs. non-flagged baseline — content is becoming more attractive, not just slower to share | Investigate if uplift ≥10% relative; rollback friction UI if confirmed |
| **Share attempt rate** | Users tap Share more often on flagged items than non-flagged (even if they abandon) — the friction trigger is drawing attention | Investigate if attempt rate ≥15% above non-flagged baseline |
| **RR delta for flagged-content sessions** | Regret Rate increases in sessions containing flagged items — flagged content is generating regret at higher rate than before friction was added | Rollback threshold: RR uplift ≥10% relative in flagged-item sessions |
| **Hostility / dogpile velocity on threads seeded by flagged items** | Downstream threads show increased hostile reply velocity after the friction UI shipped | Flag for qualitative review; include in next friction RFC |

### Effectiveness Signals (confirming friction is working)

| Metric | Target direction |
|---|---|
| Broadcast share rate on flagged items | Should decrease vs. pre-friction baseline |
| "Add a note" uptake | Track over time; high uptake = habit forming correctly |
| "Share privately" uptake | Track over time; alternative path is being used |
| RR in flagged-item sessions | Should hold steady or improve |

**Important:** "Add a note" uptake must never be optimized toward — that would turn a friction alternative into an engagement feature. Track only.

### Event taxonomy additions

- `broadcast_pause_shown` — Broadcast Pause module was displayed
- `broadcast_pause_share_privately` — user chose Share privately
- `broadcast_pause_add_note` — user entered the Add a note view
- `broadcast_pause_share_with_note` — user completed Share with note
- `broadcast_pause_broadcast_anyway` — user chose Broadcast anyway

---

## Rollback Triggers

### Immediate Rollback (same day)

Trigger if any of the following occur vs. baseline, sustained for 2+ hours:

- Regret Rate increases ≥15% relative
- AEI high-band exposure increases ≥20% relative
- Dogpile Velocity incidents increase ≥25% relative
- Notice Coverage Rate drops ≥10 percentage points

### Fast Rollback (within 24 hours)

Trigger if sustained over a full day:

- SSR decreases ≥5% relative
- Worse mood rate increases ≥10% relative (if collected)
- Rapid deck chaining (3+ decks/10 min) increases ≥20% relative and RR increases at all

### Manual Review Required (no auto-ship)

If metrics conflict (example: SSR up but RR also up), the change is blocked pending review.

---

## Metric Tolerances (Initial Values)

These are starting points and should tighten over time.

| Metric | Default Tolerance for Shipping | Notes |
|---|---|---|
| SSR | -2% relative or better | Any larger drop blocks |
| RR | +5% relative or better | Any larger rise blocks |
| Worse mood rate | +5% relative or better | Opt-in cohort only |
| AEI high-band exposure | +5% relative or better | Caps should keep this near flat |
| Dogpile incidents | +5% relative or better | Measured per 10k sessions |
| Notice coverage | -2pp or better | pp = percentage points |
| Appeal overturn rate | +5pp or better | Indicates enforcement error |

---

## Dashboards (Minimum Required)

### Daily Leadership Dashboard
- SSR, RR, WMR (if active)
- AEI high-band exposure
- Decks per session distribution (p50, p90, p99)
- Dogpile incident rate
- Moderation queue time and appeal overturn rate
- Top user complaints (qualitative)
- Perspective firewall compliance (green/red — must be green; any red blocks the dashboard)

### Weekly Product Review
- Breakdowns by intent and cohort
- Shelf usefulness yield by category
- Relationship Value Index trends
- Audit results for arousal model and moderation automation
- Perspective data quality: outlet coverage hit rate, rater data freshness alerts, mapping error corrections

### Public Transparency Cadence (monthly or quarterly)
- High-level SSR/RR trend (aggregated)
- Moderation volumes and appeal outcomes
- Major ranking RFCs shipped and what changed (plain language)
- Methodology summaries (no sensitive details)
- Perspective: active rater sources, data version, any outlet mapping corrections made, any rater methodology changes and rationale

---

## Data Integrity and Privacy Rules

**Minimize collection**
Only collect events needed for metrics and safety. No "collect everything and decide later."

**Separate research from personalization**
Mood and regret measures are aggregated and used for evaluation only. Never used to target individuals.

**Retention limits**
Set retention windows per event class (example: raw events 30–90 days, aggregated metrics longer).

**Audit trails**
All material ranking changes must be reproducible with versioned configs and logged experiment IDs.

---

## Appendix: Recommended Event Taxonomy

Intentionally minimal and focused on outcomes, not surveillance.

```
session_start
session_end
intent_selected
deck_generated          (deck_id, intent, constraints_version)
item_exposed            (item_id, content_type, arousal_band, source_type)
save_to_shelf
add_shelf
remove_shelf
reply_posted            (length_bucket, toxicity_band)
share_private
share_group
share_broadcast
hide_item
mute_user
report_content
prompt_shown
prompt_response         (satisfaction / regret / mood)
message_delivered       (conversation_id — no content; delivery confirmation only)
notification_sent       (type: push/digest/silent; conversation_id; no content)
notification_opened     (notification_id — compulsion proxy; monitor for rapid repeat opens)
perspective_panel_opened  (content_id, outlet_known: bool, civic_user: bool)
  -- NOTE: outlet identity and framing data must NOT be logged per-user in analytics pipelines
perspective_cross_coverage_opened  (content_id — user tapped "Read cross-coverage")
perspective_lens_changed  (civic_user: true — new preference value NOT logged; change event only)
  -- Lens preference is personal; only the fact of a change is tracked for data quality
```
