# Harbor Anti-Drift Constitution
### Version 0.1

---

## Preamble

Harbor exists to deliver a modern social experience without addiction mechanics, political manipulation incentives, or covert behavioral steering. This constitution defines the non-negotiable rules that prevent "success" from pushing Harbor into engagement-at-all-costs drift.

**If a proposed change would make Harbor more profitable by making people worse, it is not allowed.**

---

## 1. Non-Negotiable Product Invariants

These must remain true in all official Harbor clients.

**Finishable sessions**
- No infinite scroll as a default surface.
- Every primary surface uses finite decks with a clear end.

**Intent-first navigation**
- Users choose a mode: Catch Up / Connect / Learn / Create / Delight / Civic.
- Ranking is permitted only within the selected intent, not across intents.

**User-owned structure**
- Interests are organized into Shelves the user controls.
- Trends cannot silently take over a user's home experience.

**Algorithmic choice + baseline access**
- Users can always switch to a non-ranked baseline view (chronological or "Following only") within each surface.
- Users can always disable Explore/Discovery injection.

**No public status scoreboard by default**
- Like/follower/view counts are not the default public "score" UI.
- Recognition emphasizes quality (helpful, well sourced, well said) over virality.

---

## 2. Ranking Charter: What the Algorithm Is Allowed to Optimize

### Primary Objective

Harbor's primary optimization target is:

> **Expected Satisfied Session** — did the user get what they came for?

Plus: usefulness signals (saves, references, completion of a deck, thoughtful replies)

Minus: regret signals (user self-report + rapid hide/mute behavior)

### Allowed Signals

- Explicit follows, Shelf selections, saves, and user-set preferences
- Relationship strength (direct interactions, mutual connections) for Catch Up
- "Helpfulness" and "quality" feedback — not raw reaction volume
- Content quality signals (source transparency, originality, low spam likelihood)

### Not Allowed as Optimization Targets

Anything that directly or indirectly pushes compulsive consumption:

- Time spent, session length, watch time
- Refresh frequency
- Raw likes/reactions volume
- Reshare velocity
- Comment volume (especially angry or hostile comments)
- Streaks, intermittent reward loot mechanics, or gambling-like UI patterns

> Note: Some disallowed metrics may be used strictly for diagnostics or safety (e.g., detecting spam loops), but never as a goal the ranker tries to increase.

---

## 3. Hard Safety Constraints (Enforced by the Ranker)

These are seatbelts that cannot be bypassed by growth pressure.

**Arousal ceiling**
- Each deck has a maximum fraction of high-arousal content, defined by measurable proxies: sensational language, hostility density, volatility, and "rage engagement" signatures.
- High-arousal content is throttled and cannot dominate a session.

**Serendipity budget**
- Discovery/adjacent content is capped at 10–15% of a deck.
- Discovery must be adjacent to explicit interests. No shock funnel.

**Anti-mob amplification**
- Rapid viral spread is slowed by design: friction for broadcast reshares, read-before-share for links, cooldowns when anger-sharing is predicted.
- Dogpile dynamics trigger automatic dampening: rate limits, distribution reduction, context prompts.

**Politics and civic content handling**
- Civic content is opt-in as a mode or lane.
- No silent political injection into other intents.
- Civic ranking prioritizes source transparency and argument quality over engagement.

---

## 4. Transparency and User Control Requirements

Harbor must be legible. If users can't tell what's happening, they will assume manipulation.

**Why-am-I-seeing-this**
Every recommended item must offer a clear explanation in plain language:
- "Because you saved 6 posts on X"
- "Because you follow Y"
- "Because your group endorsed this"

**Editable signals**
Users can view, remove, or downweight major personalization inputs:
- "Stop using late-night browsing as a signal"
- "Less of this topic"
- "More from friends, less from communities"
- "Turn off adjacent discovery"

**Visible constraints**
If distribution is limited due to safety labels, spam controls, or policy enforcement, the affected user must have a clear, specific notice and an appeal path — except where doing so would materially enable abuse or spam.

---

## 5. Moderation Rules to Prevent Shadow-Ban Dynamics

Harbor will moderate. But it won't pretend moderation is invisible.

**Separate ranking from enforcement**
- Policy violations → enforcement actions (remove, label, restrict)
- Non-violations → ranking decisions governed by this constitution
- Users should be able to distinguish "downranked for safety" from "not relevant"

**Layered controls, disclosed**
- Labels (spam, graphic, unverified claim) must be inspectable by the receiving user where feasible.
- Appeals must exist for meaningful reach-impacting labels.

**Default fairness**
- Harbor may use viewpoint diversity constraints in Civic lanes.
- Harbor will never covertly manipulate ideology in general feeds.

---

## 6. Change Control: How the System Evolves Without Drifting

No major ranking or UX changes may ship silently.

**Algorithm RFC process**
Any material change to ranking objectives, constraints, or surfaces requires a public RFC describing:
- What is changing
- Why
- Expected tradeoffs
- How it will be evaluated

**Satisfaction Gate**
Changes must demonstrate:
- No meaningful decrease in satisfied-session rate
- No meaningful increase in regret signals
- No increase in compulsive usage proxies as side effects

**Rollback guarantee**
Every material change must have an immediate rollback plan and monitored triggers.

**User choice during transitions**
Users must be able to stay on the baseline/non-ranked view during major experiments.

---

## 7. Business Model Constraints (Anti-Capture by Design)

Harbor cannot fund itself in ways that reintroduce attention extraction.

**No engagement-optimized ads**
- No auction systems that optimize for clicks, watch time, or "engagement"
- No microtargeting based on behavioral profiling
- If ads exist, they must be contextual and non-manipulative

**Preferred revenue**
- Subscriptions and membership
- Creator memberships with transparent revenue share
- Community and organization hosting
- Marketplace fees (events, classes, services)

**Donor and influence limits**
- No funding agreements that grant product, moderation, or ranking control
- Publish a funding transparency ledger
- Cap any single funder's share of annual operating budget

---

## 8. Auditability and Accountability

**Public transparency reports**
Regular reports on moderation actions, labeling volumes, appeals outcomes, and major ranking updates.

**Independent audits**
Periodic third-party review of:
- Compliance with the Ranking Charter
- Evidence of addiction mechanic creep
- Civic lane neutrality constraints and disclosure

**Internal red-teaming**
Dedicated testing for "can this be gamed into outrage loops?" before every launch.

---

## 9. The Prime Directive

If Harbor must choose between:

- increasing growth by exploiting compulsive behavior, or
- protecting user agency, mental quiet, and healthy discourse

**Harbor chooses agency and health. Always.**
