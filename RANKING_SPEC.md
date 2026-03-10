# Harbor Ranking Spec
### Version 0.3 — Adds link post scoring rules (§3.6), Phase 2 link preview infrastructure notes

---

## 0. Glossary

| Term | Definition |
|---|---|
| **Intent** | User-selected mode (Catch Up / Connect / Learn / Create / Delight / Civic / Explore). Ranking is allowed only within the selected intent. |
| **Deck** | A finite set of items (default 20) generated for a single intent. |
| **Bucket** | A reserved portion of a deck (e.g., "Friends", "Groups", "Shelves", "Adjacent Discovery"). |
| **Eligibility** | Pass/fail checks that must be true before ranking (policy compliance, spam checks, muted filters, etc.). |
| **Signals** | Inputs to scoring. Disallowed signals are never used as optimization targets (time spent, reshare velocity, etc.). |
| **Arousal Score** | A 0–1 estimate of "likely to spike arousal" used for constraints, not for maximizing engagement. |
| **SSR / RR** | Satisfied Session Rate / Regret Rate (from the Metrics Standard). |

---

## 1. Goals and Non-Goals

### Goals

- Deliver highly relevant content without dopamine loops.
- Make every surface finishable and legible (clear "why this?" explanations).
- Prevent drift by optimizing for satisfaction, usefulness, and relationship value, and enforcing hard caps (arousal, serendipity, anti-mob).
- Support "early Facebook" vibes: real people, real groups, real updates.

### Non-Goals

- Maximize session length, time spent, comment volume, reshare velocity, or other compulsion proxies.
- Blend politics into default surfaces. Civic is opt-in.

---

## 2. Shared Ranking Pipeline (All Intents)

### Stage A — Eligibility & Policy (Hard Gates)

An item is eligible only if it passes:

- Policy enforcement (illegal content, harassment, explicit violence, etc.)
- User controls: mutes, blocks, "less of this", content-type exclusions
- Integrity filters: spam score threshold, bot likelihood threshold
- Distribution health: rate-limits for dogpiles/brigading if triggered
- Civic gating (Civic intent only): labeling requirements met (opinion / reporting / first-hand / satire)

If an enforcement or label materially limits reach, Harbor must provide clear notice and an appeal path per the constitution.

---

### Stage B — Candidate Generation (Recall)

Candidates are fetched from multiple sources, then deduplicated.

**Common candidate pools**

| Pool | Description |
|---|---|
| Friends / Following | Posts from people you follow within a time window |
| Groups / Communities | Posts in groups you joined, plus bulletins and events |
| Shelves / Interests | Items tagged to your shelves, and creators you follow in those topics |
| Saved / Resurfacing | "Continue where you left off," follow-ups, updates on saved threads |
| Adjacent Discovery | Topic-adjacent items from outside your graph (bounded) |
| Local / Events | Events and polls relevant to your communities (optional) |

**Deduplication rules**

- Max 2 items per author per deck (unless candidate pool is sparse)
- No near-duplicate items (same link, same image hash, same event announcement)
- Prefer variety across shelves and groups

---

### Stage C — Scoring (Intent-Specific, Constitution-Compliant)

Each candidate receives a score vector. The final score is intent-dependent but drawn from the same allowed components.

**Allowed scoring components**

| Component | Description |
|---|---|
| Predicted Satisfied Intent (PSI) | Probability the user will answer "Yes" for this intent/deck |
| Usefulness | Likelihood of save / add-to-shelf / bookmark / helpful mark |
| Relationship Value | Likelihood of meaningful interaction (reply, private share, RSVP) — Catch Up / Connect only |
| Quality | Source transparency, originality, low spam likelihood, constructive tone |
| Freshness | Time decay appropriate to intent (fast for Catch Up, slower for Learn) |

**Explicitly disallowed as optimization targets**

- Time spent / watch time / session length
- Raw likes / reactions volume
- Comment volume
- Reshare velocity / virality likelihood

These may be used only for integrity detection, never as ranking goals.

---

### Stage D — Constraint Solver & Deck Assembly (Hard Rules)

Decks are assembled using a bucket plan (composition targets + hard caps). The solver:

1. Reserves slots per bucket (Friends, Groups, Shelves, Adjacent)
2. Fills each bucket by score while enforcing: arousal ceiling, serendipity budget, anti-mob dampening, diversity/novelty constraints, no consecutive high-arousal
3. Performs a final re-rank to improve flow (avoid tone whiplash)
4. Emits explanation metadata per item

---

### Stage E — Explanations (Required)

Every delivered item must carry:

- **Primary reason** (human-readable): "Because you follow Alex" / "Because you saved espresso posts" / "From your Denver Running group"
- **Secondary reason** (optional): "Similar to items you saved in your Networking shelf"
- **Control hook**: Less like this / More from this shelf / Mute topic / Switch to chronological

---

### Stage F — Logging (Metrics Standard)

Log deck generation with:
- Intent, deck_id, bucket plan version
- Per item: source bucket, arousal band, explanation reason codes, enforcement labels (if any)

---

## 3. Shared Score Definitions

### 3.1 Predicted Satisfied Intent (PSI)

Predicts "user would report satisfied" for the selected intent.

**Training targets (allowed)**
- Satisfaction prompt outcomes (SSR)
- Usefulness actions (save / add-to-shelf / helpful)
- Deck completion (binary, not time spent)
- Meaningful interaction indicators (RVI components)

### 3.2 Usefulness Score

Predicts saves, adds-to-shelf, bookmarks, "helpful," "well said," "made me think."

### 3.3 Relationship Value Score (Catch Up / Connect)

Predicts high-quality interaction:
- Replies above a minimum effort threshold
- Private shares to a person or small group
- Event actions (RSVP, vote)

### 3.4 Quality Score

A blend of:
- Account reputation (age, verified identity signals if used, low abuse history)
- Content integrity (originality, link trust signals, citation presence where relevant)
- Civility / constructiveness classifiers (used conservatively and audited)

### 3.5 Arousal Score (Constraint Only)

Derived from:
- Sensational language / hostility density proxies
- Volatility signatures (sudden hostile reply spikes)
- Rage-engagement patterns (ratio of hostile comments to constructive replies)

Used only to enforce caps, avoid consecutive high-arousal items, and trigger dampening. Never used to maximize engagement.

---

### 3.6 Link Post Rules (Phase 2+)

When a post contains a URL with a successfully scraped link preview (`link_previews.failed = false`):

- The post is eligible in all intents (treated identically to text posts for ranking purposes)
- The scraped `title` and `description` from the link preview are included in arousal scoring (body text + preview text concatenated before scoring)
- **Perspective domain lookup** (Phase 3): if `canonical_url` resolves to a known outlet in the outlet registry, the card is eligible for the Perspective panel — the domain is checked at render time, not at scoring time
- No ranking boost for posts with link previews vs. plain text — Harbor does not incentivise link sharing over original writing
- Posts where the scrape failed or is pending render as plain text posts — no link card shown, no ranking penalty

**YouTube posts** follow the same rules. The `is_youtube` flag is a rendering hint only — it carries no ranking weight.

**Prohibited:** outlet reliability tier from Perspective data must never be used as a ranking signal, even after Phase 3 ships. See §10.2.

---

## 4. Default Deck Parameters (Global)

| Parameter | Default Value |
|---|---|
| Deck size | 20 items |
| High-arousal cap | ≤10% of deck (max 2 of 20) |
| Consecutive high-arousal | Not allowed |
| Serendipity budget | ≤10–15% of deck (max 2–3 of 20) |
| Author cap | Max 2 items per author per deck |
| Baseline view | Always available within each intent (Following-only chronological) |

---

## 5. Intent Specs

### 5.1 Catch Up

**Job:** See what changed with people you care about and your key groups — fast, finite, satisfying.

**Candidate pools**
- Friends/Following: since last visit (priority), then last 72 hours
- Important updates: life events, photos, direct mentions, replies to you
- Key group announcements you opted into

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Friends / Following | 12 | 60% |
| Groups you joined | 6 | 30% |
| Resurfacing (follow-ups) | 2 | 10% |
| Adjacent Discovery | 0 | — default off |

**Ranking emphasis:** Relationship Value ↑, Freshness ↑, PSI ↑, Usefulness moderate

**Special rules**
- "Since you were away" framing: prefer one good post per person over many from one person
- Minimize topic whiplash; keep tone stable
- Civic content from friends: allowed only if user enables "Civic snippets in Catch Up" (default off)

---

### 5.2 Connect

**Job:** Participate in communities; coordinate; have repairable conversations.

**Candidate pools**
- Group threads with high constructive participation (not raw volume)
- Events, polls, announcements
- Requests for help/answers in groups you joined
- Replies to your recent comments

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Group threads | 10 | 50% |
| Events / Polls / Announcements | 4 | 20% |
| Replies / mentions to you | 4 | 20% |
| Adjacent Discovery (group-adjacent, low arousal) | 2 | 10% |

**Ranking emphasis:** Constructiveness ↑, Community affinity ↑, PSI ↑, Freshness moderate

**Anti-mob rules**
If a thread shows dogpile velocity: auto-dampen distribution and insert context prompts. Do not push it broadly.

---

### 5.3 Learn

**Job:** High-signal content aligned to your interests; keep what matters.

**Candidate pools**
- Shelf-tagged posts and collections
- Creators you follow in shelf topics
- "Best of" lists curated by trusted circles
- Updates on saved items

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| From your Shelves | 12 | 60% |
| Followed creators | 4 | 20% |
| Resurfacing | 2 | 10% |
| Adjacent Discovery | 2 | 10% |

**Ranking emphasis:** Usefulness ↑↑, Quality ↑, PSI ↑, Freshness slow decay

**Special rules**
- Encourage "collections" and "issues" (mini-magazines) to reduce drip-feed compulsion
- Prefer explainers and primary-source-linked posts

---

### 5.4 Create

**Job:** Make and share things; get thoughtful feedback; collaborate.

**Candidate pools**
- Prompts and collab invites from friends/groups
- Requests for feedback in your niches
- Draft exchanges and "review circles"
- Topic-specific creation challenges (non-viral, bounded)

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Requests / prompts from your network | 8 | 40% |
| Feedback opportunities | 6 | 30% |
| Community challenges | 4 | 20% |
| Adjacent (low arousal) | 2 | 10% |

**Ranking emphasis:** PSI ↑, Community affinity ↑, Quality ↑, Freshness moderate

**Special rules**
Reward thoughtful feedback (helpful marks, referenced suggestions), not applause.

---

### 5.5 Delight

**Job:** Fun and lightness without escalation.

**Candidate pools**
- Creators you follow tagged Delight
- Friend-shared items (private resonance)
- Humor/art from your shelves

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Followed creators | 10 | 50% |
| Friend shares / reactions | 6 | 30% |
| Shelf-adjacent | 2 | 10% |
| Adjacent Discovery (low arousal only) | 2 | 10% |

**Ranking emphasis:** PSI ↑, Quality ↑, Freshness moderate

**Hard limits**
- Stronger arousal cap than other intents: max 1 high-arousal item per deck
- No autoplay; no infinite continuation

---

### 5.6 Civic (Opt-In Lane)

**Job:** Serious discussion and informed updates with transparency and reduced manipulation.

**Candidate pools**
- Sources and creators explicitly followed for civic content
- Local civic info tied to your communities (events, school board, volunteer drives)
- Explainers and "what's known/unknown" context cards
- Viewpoint-diverse sampling within topic (explicit, disclosed)

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Sources you follow | 8 | 40% |
| Topic explainers / context | 6 | 30% |
| Viewpoint-diverse items | 4 | 20% |
| Local civic / community actions | 2 | 10% |

**Ranking emphasis:** Source transparency ↑↑, Argument quality ↑, PSI ↑, Freshness moderate

**Disclosure requirement**
Civic diversity sampling must be labeled: "Showing a range of perspectives on [topic]. Adjust."

**Anti-viral rules**
- More friction for broadcast resharing
- Faster dampening when dogpile/brigading signals appear

**Perspective integration (Civic only)**
- News link cards in Civic decks show the full Perspective panel: reliability range + framing-grouped coverage dot grid
- The user's lens preference (`perspective_user_lens.framing_preference`) may affect which articles surface in the cross-coverage reader — it does **not** affect deck composition or scoring
- Perspective data is context shown to the reader; it is never a scoring input, not even in Civic

---

### 5.7 Explore (Explicit Discovery Mode)

**Job:** Find new creators and communities without getting hijacked.

**Candidate pools**
- Adjacent topics to shelves
- "Trusted circle picks" (people you trust saved this)
- New communities similar to ones you're in
- New creators with high usefulness quality (not high virality)

**Bucket plan (20 items)**

| Bucket | Items | % |
|---|---|---|
| Adjacent to shelves | 8 | 40% |
| Trusted picks | 6 | 30% |
| New communities / events | 4 | 20% |
| Wildcard (low arousal only) | 2 | 10% |

**Ranking emphasis:** Quality ↑↑, Usefulness ↑, PSI ↑, Freshness low priority

**Hard limits**
- Strict arousal cap: ideally 0–1 high-arousal items per deck
- No "trending global outrage" bucket, ever

---

## 6. Cold Start Rules (New Users)

Goal: make Harbor feel valuable before the network effect hits.

**Onboarding steps (ranking-relevant)**
1. Choose 5–10 shelves (interests)
2. Choose 5–20 starter people or curators (import contacts + suggested)
3. Join 2–5 starter communities (local / hobby / professional)

**Cold-start deck composition**
- Learn / Shelves is primary early value
- Catch Up becomes primary once the friend graph fills

**Guardrails**
- Do not substitute "trending" as a shortcut for content supply
- Keep Explore explicit; never inject discovery into Catch Up to fill emptiness

---

## 7. Abuse & Gaming Resistance (Ranking-Level)

- Rate-limit distribution for accounts with spam or brigade signals
- Penalize duplicate/templated content (meme-farm behavior)
- Downrank "engagement bait" patterns (rage-prompt formats) via quality heuristics
- Require read-before-share for links; add friction to broadcast reshares
- Detect dogpiles and dampen distribution automatically

---

## 8. User Controls (Required in Every Intent)

**View switching**
- Harbor Ranked (default)
- Following-only chronological (baseline)

**Sliders / toggles**
- More / less from Friends vs. Groups (where applicable)
- More / less adjacent discovery (where allowed)
- More / less deep content (Learn)
- Turn off Civic snippets globally (default off)

**Per-item controls**
- Less like this / More like this
- Mute topic / Mute source / Block user
- "Why am I seeing this?"

---

## 9. Experimentation Notes (Built-in Anti-Drift)

Any change to the following is a material change and must pass the RFC, gating, and rollback rules from the Metrics Standard:

- Bucket plans
- Arousal or serendipity caps
- Scoring weights or objectives
- Default surfaces

---

## 10. Prohibited Signals

This section is the canonical list of signals that are **never allowed as optimization targets or ranking features** in any Harbor model or heuristic. It consolidates rules from the Constitution (§2, §11) and the Ranking Charter into a single enforceable reference.

### 10.1 Compulsion-Proxy Signals (Constitution §2)

These signals are banned as optimization targets because they are proxies for compulsive consumption, not satisfaction:

| Signal | Why Banned |
|---|---|
| Time spent / session length / watch time | Optimizes for compulsion, not value |
| Raw like / reaction count | Rewards viral content regardless of quality |
| Comment volume | Rewards controversy and outrage |
| Reshare / repost velocity | Amplifies mobs and misinformation |
| Refresh frequency | Measures anxiety, not satisfaction |
| Streaks / daily active pressure | Compulsion loop mechanic |
| Rage comment ratio | Anger is not engagement quality |
| Return-to-app rate | Habit formation proxy, not satisfaction |

> **Diagnostic use exception:** Some of these (e.g., reshare velocity, hostile comment ratio) may be used strictly for integrity detection — spam loops, dogpile detection, bot farming. They must never appear as features in the PSI model, usefulness model, or any deck scoring pipeline.

### 10.2 Perspective Data: Fully Prohibited Ranking Signals (Constitution §11)

Perspective data describes news outlet context. It is information *for the reader*, not input *for the algorithm*. The following fields and tables are constitutionally prohibited as features in any ranking model, scoring heuristic, or deck composition query:

| Prohibited Signal | Source | Why |
|---|---|---|
| `outlet_reliability_tier` | `perspective_outlets` | Making reliable sources rank higher creates an implicit trust arbiter; this is an editorial judgment Harbor must not make algorithmically |
| `outlet_framing_direction` | `perspective_coverage` | Any use in ranking constitutes covert political injection — even in Civic Lane |
| `story_coverage_breadth` | `perspective_coverage` count | Giving widely-covered stories higher scores rewards news virality, not user satisfaction |
| `framing_lean_score` | derived from `perspective_outlets.rater_data` | Any numeric lean → score mapping in the ranker is political manipulation by another name |
| `perspective_outlet_id` | `perspective_outlets` | Outlet identity must not be a scoring feature; that would make Harbor an implicit outlet-quality arbiter |
| `rater_data.*` (any subfield) | `perspective_outlets.rater_data` JSONB | Same as above; disaggregating by rater doesn't make this acceptable |
| User's `framing_preference` | `perspective_user_lens` | Lens preference is a UI filter for the cross-coverage reader, not a personalization signal for deck content |

**Violation handling:** Any confirmed use of these signals in a ranking model or deck assembly query is a **material Ranking Charter violation** requiring:
1. Immediate rollback of the affected model/config
2. An incident report posted to the public transparency log
3. A constitutional review before re-attempting the experiment

### 10.3 The Narrow Perspective Exception

The only permitted use of Perspective data that touches ranking-adjacent systems is:

> A user's `framing_preference` from `perspective_user_lens` may influence which articles are pre-loaded in the **cross-coverage reader** when the user explicitly taps "Read cross-coverage" inside Civic Lane.

This is permitted because:
- It is user-initiated (tap required)
- It affects a secondary reader surface, not the deck
- It is scoped to Civic Lane only
- It is disclosed to the user ("Lens: Center — Adjust")

This exception does **not** extend to deck composition, deck scoring, candidate generation, or any part of the Stage A–F pipeline.

### 10.4 Enforcement

The prohibited signal list is enforced through:

1. **Code assertions** in `deck_engine.py` — model feature names are checked against the prohibited list at startup (see Implementation Plan §9.3)
2. **PR review gate** — any PR touching the ML pipeline or deck engine must include a sign-off from the Compliance Agent confirming no prohibited signals were introduced
3. **Nightly automated audit** — a test job queries the model's feature importance log and fails if any prohibited signal name appears with non-zero importance
4. **Transparency report** — the quarterly report includes a section confirming prohibited signal audit results
