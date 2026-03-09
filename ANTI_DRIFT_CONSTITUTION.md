# Harbor Anti-Drift Constitution
### Version 0.2

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
- News source context (Perspective) is governed by §11. Framing data is Civic-only; reliability context is available broadly.

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

## 9. Messaging Privacy

Harbor messaging must be private by design — not private by policy. The following constraints are non-negotiable.

**End-to-end encryption**
- All direct messages are end-to-end encrypted using an open, auditable protocol (Signal Protocol or equivalent).
- Harbor servers may store and relay encrypted ciphertext only. Store-and-forward for offline delivery is allowed; Harbor cannot read message contents.
- Keys are generated and stored on user devices. No server-side key escrow. Server-side storage is limited to public key material required for session setup.

**Forward secrecy**
- The protocol must provide forward secrecy such that compromise of a long-term key does not expose past messages.
- Key ratcheting is implemented per message or per session, consistent with the protocol.

**Metadata minimization and retention limits**
- Harbor retains only the metadata required to route and deliver messages: sender/recipient identifiers, message ID, message timestamp, delivery status, and device routing info.
- Retention limits are mandatory: routing and delivery metadata must be deleted on a fixed schedule (within 30 days) unless required for an abuse investigation initiated by a user report.
- Infrastructure logs (e.g., IP-level logs) must be minimized and have short retention (7–14 days), and may be used only for reliability and abuse prevention.

**No analytics or ranking use**
- Messaging metadata is not used as a personalization signal, is not included in any ranking graph, and is not surfaced in analytics pipelines except as aggregate reliability metrics (e.g., delivery success rate) without user-level linkage.

**Notifications — allowed, but non-compulsive by design**
- Push notifications are allowed and must be content-free by default (e.g., "New message from Alex" or "You have a new message" — no preview of content unless the user explicitly enables previews).
- Push notifications must be rate-limited and batchable to prevent ping loops (see Design Bible §8 for implementation guidelines).
- Messaging notifications must not be designed to increase session frequency or time spent.

**No engagement mechanics in messaging**
- No numeric unread count badges on the app icon or tab bar.
- A binary "unread" indicator (e.g., a dot) is allowed to signal "new messages exist" without displaying a number.
- No read receipts by default (opt-in only; both parties must agree).
- No typing indicators by default (opt-in only).
- No message reaction counts visible to third parties.
- Messaging does not feed any algorithm or ranking system.

**Safety without content access**
- Abuse prevention may use metadata-only mechanisms (rate limiting, spam heuristics, blocklists) but must not involve server-side content inspection.
- Reporting is user-controlled: when a user reports abuse, the client may attach decrypted message content and relevant context only with explicit user consent.

**User control and deletion semantics**
- Users can delete their copy of any conversation at any time (local delete).
- Users can request deletion of their messages from the recipient's device as a best-effort feature; Harbor cannot guarantee deletion and recipients may retain copies. This limitation must be disclosed honestly.
- Users can disable messaging entirely from settings.
- Blocking is immediate and does not notify the blocked party.

**Auditability without content access**
- Independent auditors must be able to verify correct cryptographic implementation without accessing message content.
- Open-source client cryptography libraries and reproducible builds are used where possible so implementations are inspectable.

---

## 11. Perspective: News Context and Source Transparency

Perspective is Harbor's context layer for news and current events. It makes framing visible and cross-reading effortless — without Harbor acting as a truth authority, a bias arbiter, or a covert ranking lever.

**No single neutral verdict**
- Harbor does not declare any outlet, story, or framing "neutral" or "correct."
- Outlet attributes (framing tendency, reliability) are always displayed as ranges sourced from multiple independent third-party raters, never collapsed into a single Harbor-issued score.
- Rater disagreement is shown honestly. When raters diverge, the range widens; Harbor does not average away the uncertainty.

**Framing data is Civic-only; reliability context is universal**
- The framing axis (political lean: Left ↔ Center ↔ Right) is available only to users who have opted into Civic Lane.
- Reliability context (source credibility range, coverage breadth, "other outlets covered this") may be shown to all users on news link previews, collapsed by default outside Civic.
- This boundary cannot be softened without a constitutional amendment. Showing framing data to non-Civic users would be a form of silent political injection.

**Perspective labels are informational. They are not enforcement.**
- A Perspective label — framing range, reliability range, coverage split — is context for the reader. It is not a policy action.
- Perspective data must not influence content moderation decisions, distribution limits, or ranking in any pipeline.
- If a future policy need arises where source credibility becomes relevant to enforcement (e.g., known state-sponsored disinformation), that must be governed by a separate, explicitly documented constitutional article with its own review process. It may not be handled as a Perspective carve-out.

**Separation from ranking**
- Perspective signals — outlet lean, reliability scores, rater data, lens preferences — must not appear as features in any ranking model or deck composition query, with one narrow exception: a user's chosen Perspective lens may influence context pack selection and, optionally, Civic deck composition when the user has opted into Civic.
- This exception is user-initiated, Civic-scoped, and must be disclosed. It does not apply to general feed ranking under any circumstances.
- Any Perspective table in the database schema is considered a prohibited signal source for ranking. Violations of this boundary are treated as material ranking charter violations.

**Methodology disclosure and rater transparency**
- Harbor must publish which rating organizations are used, the date of last update, and a plain-language description of what each metric means.
- The criteria for including or excluding a rater must be published and versioned. Criteria must include: published methodology, no direct financial relationship with rated outlets, and a multi-perspective review process.
- When raters are added, removed, or change their methodology, Harbor publishes what changed and why. This is subject to the RFC process in §6.

**Dispute handling**
- Outlets may report factual mapping errors to Harbor (wrong domain → outlet identity assignment). Harbor will investigate and correct verified errors.
- Disputes about lean or reliability categorization are directed to the relevant third-party raters. Harbor does not hand-rate ideology.
- Harbor publishes the dispute process and resolution timelines in its transparency report.

**Versioning**
- Perspective clustering logic, rater sources, and context pack rules are versioned. Changes require an RFC per §6.
- Users must be able to see which version of Perspective is active and what changed in plain language.

---

## 10. The Prime Directive

If Harbor must choose between:

- increasing growth by exploiting compulsive behavior, or
- protecting user agency, mental quiet, and healthy discourse

**Harbor chooses agency and health. Always.**
