# Harbor Implementation Plan
### Version 1.1 — Aligned with Constitution, Metrics Standard, and Ranking Spec

---

## 0. Guiding Technical Principles

1. **The algorithm must be auditable.** Every ranking decision can be traced to an explicit signal. No black-box optimization.
2. **Satisfaction is a first-class metric.** The ML pipeline optimizes for session satisfaction scores, not engagement proxies.
3. **Privacy by architecture.** User signals are processed with minimum necessary data. Preference graphs stay user-controlled and exportable.
4. **Mobile-first, but not mobile-only.** Native mobile is the primary surface; web is a full peer.
5. **Scale later.** Build for quality first. Optimize for scale at Phase 3, not Phase 1.

---

## 1. Tech Stack

### 1.1 Mobile (Primary Surface)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **React Native + Expo** | Cross-platform, strong ecosystem, Expo Router for navigation, OTA updates |
| Navigation | **Expo Router** (file-based) | Native stack navigation, deep linking, typed routes |
| State management | **Zustand** | Lightweight, no boilerplate, good for session/intent state |
| Server state | **TanStack Query** | Deck loading, pagination, optimistic saves, background refetch |
| Animations | **React Native Reanimated 3** | Deck swipe gestures, card transitions, check-in sheet |
| Gestures | **React Native Gesture Handler** | Swipe navigation, long-press save |
| Local storage | **MMKV** | Fast key-value for intent history, token cache |
| Offline support | **WatermelonDB** | Shelves and saved items available offline |
| Styling | **Shopify Restyle** or **NativeWind** | Token-based theming, dark mode, responsive |

### 1.2 Web

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR for SEO, RSC for performance, same React skills as mobile |
| Styling | **Tailwind CSS + CSS custom properties** | Design tokens as CSS variables, utility-first, dark mode |
| Animation | **Framer Motion** | Web deck transitions, intent selector, check-in sheet |
| State | **Zustand** (shared logic with mobile where possible) | |

### 1.3 Backend

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | **Node.js 22 + TypeScript** | Familiar, typed, great ecosystem |
| API framework | **Fastify** | Fast, schema-first, built-in OpenAPI |
| Primary database | **PostgreSQL 16** | Relational, strong JSON support, pgvector for embeddings |
| Vector store | **pgvector** (PostgreSQL extension) | Content and shelf embeddings for similarity ranking |
| Cache | **Redis (Valkey)** | Deck pre-computation, session state, rate limiting |
| Message queue | **BullMQ (Redis-backed)** | Async jobs: deck generation, arousal scoring, satisfaction processing |
| Object storage | **Cloudflare R2** | Media (images, video thumbnails), shelf exports |
| CDN | **Cloudflare** | Global edge, image optimization, DDoS protection |
| Search | **Typesense** | Self-hosted, fast, typo-tolerant full-text search for shelves + Explore |

### 1.4 ML / Algorithm

| Component | Choice | Rationale |
|---|---|---|
| Satisfaction model | **Python + scikit-learn / LightGBM** | Interpretable models — auditable by design |
| Embeddings | **Sentence Transformers (SBERT)** | Content similarity, shelf affinity, serendipity adjacency |
| Arousal detection | **HuggingFace Transformers** (fine-tuned classifier) | Sensational phrasing, outrage density detection |
| Serving | **FastAPI** | Lightweight Python API for ML inference |
| Experimentation | **GrowthBook** | Feature flags, A/B testing with satisfaction as primary metric |
| Monitoring | **Evidently AI** | Model drift detection, data quality |

### 1.5 Infrastructure

| Component | Choice |
|---|---|
| Container orchestration | **Docker Compose (dev) → Docker Compose (VPS Phase 1) → Kubernetes (Phase 3)** |
| CI/CD | **GitHub Actions** |
| Secrets | **Doppler** |
| Observability | **OpenTelemetry → Grafana Cloud** |
| Error tracking | **Sentry** |
| Hosting (API/Web) | **Ionos VPS (2 vCPU, 2GB RAM, 80GB NVMe) Phase 1 → Fly.io Phase 2 → AWS/Azure Phase 3** |
| Database hosting | **Supabase (Phase 1-2) → RDS (Phase 3)** |
| Frontend hosting | **Next.js SSR on VPS behind existing reverse proxy (Phase 1) → Fly.io (Phase 2)** |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTS                             │
│   [React Native / iOS]  [React Native / Android]  [Next.js Web]
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY                           │
│              (Fastify + rate limiting)                  │
└──┬─────────────┬──────────────┬──────────────┬──────────┘
   │             │              │              │
┌──▼───┐   ┌────▼────┐   ┌─────▼────┐   ┌────▼──────┐   ┌────▼──────┐
│ Auth │   │ Content │   │  Deck    │   │  Social   │   │Moderation │
│ Svc  │   │  Svc    │   │  Engine  │   │   Svc     │   │   Svc     │
└──┬───┘   └────┬────┘   └─────┬────┘   └────┬──────┘   └────┬──────┘
   │             │              │              │               │
┌──▼─────────────▼──────────────▼──────────────▼───────────────▼──────┐
│                   PostgreSQL + pgvector                              │
│                   Redis (Valkey) cache                               │
└───────────────────────┬──────────────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│                  ML SERVICES                           │
│  [Satisfaction Model]  [Arousal Classifier]           │
│  [Embedding Service]   [Serendipity Budget Engine]    │
│  [Dogpile Detector]    [Quality Classifier]           │
└───────────────────────────────────────────────────────┘
```

### 2.2 Database Schema (Core)

```sql
-- Users
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle       TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  settings     JSONB DEFAULT '{}'  -- serendipity budget, civic opt-in, etc.
);

-- Shelves
CREATE TABLE shelves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES shelves(id),  -- sub-shelves
  embedding  vector(384),                  -- shelf topic embedding
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Items (Shelf contents)
CREATE TABLE saved_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  shelf_id    UUID REFERENCES shelves(id),
  content_id  UUID REFERENCES content(id),
  saved_at    TIMESTAMPTZ DEFAULT NOW(),
  note        TEXT
);

-- Content
CREATE TABLE content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id),
  content_type  TEXT NOT NULL,  -- post, article, image, video, thread
  body          TEXT,
  media_urls    JSONB,
  embedding     vector(384),    -- semantic content embedding
  arousal_score FLOAT,          -- 0.0-1.0, computed async
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  metadata      JSONB DEFAULT '{}'
);

-- Sessions
CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  intent         TEXT NOT NULL,  -- catch_up, learn, connect, create, delight
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  deck_count     INT DEFAULT 0,
  satisfaction   SMALLINT,       -- 1=yes, 2=sort_of, 3=no (null if skipped)
  mood_delta     SMALLINT        -- 1=better, 2=same, 3=worse (null if skipped)
);

-- Deck Items (what was shown in each deck)
CREATE TABLE deck_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES sessions(id),
  content_id      UUID REFERENCES content(id),
  position        SMALLINT NOT NULL,
  is_serendipity  BOOLEAN DEFAULT false,
  shown_at        TIMESTAMPTZ,
  engagement      TEXT,  -- saved, replied, shared, skipped, throttle_shown
  dwell_ms        INT    -- only used to detect <1s skip, NOT engagement optimization
);

-- User Signals (the personalization graph — fully exportable)
CREATE TABLE user_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  signal_type TEXT NOT NULL,  -- shelf_save, helpful, skip, less_of_this, etc.
  content_id  UUID REFERENCES content(id),
  shelf_id    UUID REFERENCES shelves(id),
  value       FLOAT DEFAULT 1.0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT true  -- user can deactivate a signal
);

-- Relationships
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id),
  followee_id UUID REFERENCES users(id),
  strength    FLOAT DEFAULT 1.0,  -- relationship weight, updated by mutual engagement
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

-- Deck Items extended (Ranking Spec Stage F logging)
-- NOTE: deck_items table above needs these additional columns:
-- source_bucket          TEXT     -- friends, groups, shelves, adjacent_discovery
-- arousal_band           TEXT     -- low, medium, high
-- explanation_reason_codes JSONB  -- ["shelf_save:networking", "trusted_network:3"]
-- bucket_plan_version    TEXT     -- semver of the bucket plan used

-- Moderation Actions (Constitution: separate ranking from enforcement)
CREATE TABLE moderation_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     UUID REFERENCES content(id),
  user_id        UUID REFERENCES users(id),
  action_type    TEXT NOT NULL,  -- remove, label, restrict_distribution, warn
  label          TEXT,           -- spam, graphic, unverified_claim, policy_violation
  reason         TEXT NOT NULL,  -- specific reason, shown to user
  policy_section TEXT,           -- link to policy
  actioned_at    TIMESTAMPTZ DEFAULT NOW(),
  notice_sent    BOOLEAN DEFAULT false,
  appeal_id      UUID            -- FK to moderation_appeals
);

-- Moderation Appeals
CREATE TABLE moderation_appeals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id      UUID REFERENCES moderation_actions(id),
  user_id        UUID REFERENCES users(id),
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  status         TEXT DEFAULT 'pending',  -- pending, upheld, overturned
  resolved_at    TIMESTAMPTZ,
  resolution_note TEXT
);

-- Ranking RFC Log (Constitution: no material changes without RFC)
CREATE TABLE ranking_rfcs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  what_changes   TEXT NOT NULL,
  why            TEXT NOT NULL,
  tradeoffs      TEXT,
  evaluation_plan TEXT,
  status         TEXT DEFAULT 'draft',  -- draft, review, approved, shipped, rolled_back
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  shipped_at     TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

-- Versioned Ranking Configs (for rollback guarantee)
CREATE TABLE ranking_config_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT NOT NULL UNIQUE,
  config      JSONB NOT NULL,  -- full bucket plan, weights, caps
  rfc_id      UUID REFERENCES ranking_rfcs(id),
  deployed_at TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT false
);
```

---

## 3. The Deck Engine

The heart of Harbor. This is what generates the 20-card deck for each intent session.

### 3.1 Deck Generation Pipeline

The pipeline follows the Ranking Spec Stage A–F structure.

```
STAGE A — ELIGIBILITY & POLICY (hard gates, fail fast)
   Policy enforcement (illegal content, harassment, explicit violence)
   User controls: mutes, blocks, "less of this", content-type exclusions
   Integrity filters: spam score threshold, bot likelihood threshold
   Distribution health: rate-limits for active dogpile/brigading events
   Civic gating: civic content blocked unless intent = Civic AND user opted in

STAGE B — CANDIDATE GENERATION (recall ~200 items)
   Fetch from intent-appropriate pools:
   - Friends/Following (recency window per intent)
   - Groups/Communities (posts + bulletins + events)
   - Shelves/Interests (shelf-tagged + followed creators in topic)
   - Saved/Resurfacing (follow-ups, updates on saved threads)
   - Adjacent Discovery (bounded; intent-specific arousal threshold)
   Dedup: max 2 per author; no near-duplicate links or image hashes

STAGE C — SCORING (intent-specific, constitution-compliant)
   Score each candidate with:
   - PSI (Predicted Satisfied Intent) — primary objective
   - Usefulness Score (save / shelf / helpful likelihood)
   - Relationship Value Score (Catch Up / Connect only)
   - Quality Score (source integrity, constructiveness, originality)
   - Freshness decay (fast for Catch Up, slow for Learn)
   BANNED from scoring: time_spent, watch_time, like_count,
                        comment_volume, reshare_velocity

STAGE D — CONSTRAINT SOLVER & DECK ASSEMBLY
   Reserve slots per bucket (Friends, Groups, Shelves, Adjacent)
   Fill each bucket by score while enforcing:
   - Arousal ceiling: high-band items (≥0.67) ≤ 10% of deck (max 2 of 20)
   - Delight/Explore: stricter cap — max 1 high-arousal item
   - No consecutive high-arousal items
   - Serendipity budget: adjacent discovery per user setting (default 15%)
   - Serendipity arousal threshold: ≤0.33 for Delight/Explore; ≤0.50 for others
   - No serendipity in positions 1, 2, 3
   - Civic content: only in Civic intent context
   - Deduplicate against last 3 sessions
   Final re-rank for tone flow (avoid whiplash between items)

STAGE E — EXPLANATION GENERATION (required for every item)
   Generate human-readable reason codes per item:
   - Primary: source bucket ("From your groups")
   - Secondary: signal basis ("Because you saved 8 posts on Networking")
   - Serendipity flag + budget disclosure if applicable
   - Enforcement notice if distribution was limited
   Store as explanation_reason_codes JSONB on deck_items

STAGE F — LOGGING
   Log to deck_items:
   - intent, deck_id, bucket_plan_version
   - Per item: source_bucket, arousal_band, explanation_reason_codes,
               enforcement_labels (if any), position
   Cache deck in Redis (30-minute TTL)
   Stream first 5 cards immediately; load remainder in background
```

### 3.2 Satisfaction Model (v1)

**Problem framing:** Given a completed session, predict whether the user will report "Yes, I got what I came for."

**Training targets (allowed):**
- Satisfaction prompt outcomes (SSR check-in responses)
- Usefulness actions (save / add-to-shelf / helpful)
- Deck completion (binary — did the user reach card 20? Not time spent.)
- RVI components (quality replies, private shares, event actions)

**Features:**
```python
features = {
    # Session-level
    "intent": str,                    # catch_up, learn, etc.
    "deck_count": int,                # how many decks loaded
    # NOTE: session_duration_min intentionally omitted — time proxy

    # Content signals
    "save_rate": float,               # saves / cards seen
    "helpful_rate": float,            # helpful reactions / cards seen
    "skip_rate": float,               # fast skips / cards seen
    "reply_rate": float,              # replies / cards seen
    "serendipity_positive_rate": float,

    # Shelf affinity
    "avg_shelf_similarity": float,    # avg embedding distance of shown content
    "new_shelf_content_ratio": float, # % of content from new/discovery sources

    # Creator diversity
    "unique_creators": int,
    "known_creator_ratio": float,

    # Context
    "time_of_day": int,               # 0-23
    "day_of_week": int,
    "days_since_last_session": float,
}
```

**Model:** LightGBM classifier → probability of satisfaction = 1 (yes)
**Training:** Bootstrapped from check-in data (cold start: use save_rate as proxy)
**Update cadence:** Nightly retraining on rolling 30-day window
**Auditability:** SHAP values logged per deck — "why did this deck rank this item?"

### 3.3 Arousal Detection (v1)

**Approach:** Lightweight binary classifier (fine-tuned on HateSpeech/SemEval emotional intensity datasets)

**Input features:**
- Text features: sensational phrasing patterns, insult density, all-caps ratio, punctuation intensity
- Engagement pattern: if post is new and reaction velocity is high + reactions are polarized
- Community signal: if 30%+ of reactions are "disagree" or engagement is lopsided

**Thresholds (aligned with Metrics Standard bands):**
```
0.00 – 0.33:  Low — normal content, unrestricted
0.34 – 0.66:  Medium — monitored (tracked, not throttled)
0.67 – 0.89:  High — throttled (amber indicator, read-before-share, ≤2 per deck, non-consecutive)
0.90+:        Excluded from standard decks (Civic Lane only with extra friction)
```

**Important:** Arousal score is NOT used to demote political viewpoints — it is viewpoint-neutral. A left-wing outrage post and a right-wing outrage post get the same score for the same signal patterns.

### 3.4 Serendipity Budget

Each user has a serendipity budget: a percentage of each deck devoted to adjacent discovery.

```
Budget levels:
- Low:     5%  (1 item per 20-card deck)
- Medium:  15% (3 items per 20-card deck) ← default
- High:    25% (5 items per 20-card deck)
- Off:     0%  (pure personalization)
```

"Adjacent" is computed as: content whose embedding is within 0.3–0.6 cosine distance from any of the user's shelf embeddings. Content that's too similar (< 0.3) is not serendipitous. Content that's too far (> 0.6) is not adjacent — it's random.

---

## 4. Sharing & Virality Control

### 4.1 Share Action Pipeline

```
User taps Share
→ Default options presented: "Share with a friend" / "Share to a group"
→ "Share to all followers" is third option (not default)
→ If content has arousal_score > 0.7:
    → Show throttle indicator
    → Require 3 seconds before share options activate
    → Show "Did you read this?" prompt
→ If link and user has not scrolled past article fold:
    → Show "You haven't read this yet" prompt (not blocking, just honest)
→ If model predicts anger-sharing (high arousal + user engagement pattern):
    → Add 10-second cooldown
    → Show "Take a moment" message (calm, not preachy)
```

### 4.2 Virality Architecture

Harbor deliberately flattens virality curves:

- **No "trending" feed** in standard mode (only in Explore, as an opt-in section)
- **Amplification is earned, not bought** — a post reaches more people by accumulating shelf saves and helpful reactions, not raw shares
- **Follower-weighted reach** — 1 share from someone with 50k followers does NOT multiply 50k times. Reach is gated by the recipient's shelf affinity and intent mode.
- **Time decay is fast** — a viral post from 48 hours ago is not injected into a "Catch Up" deck. Catch Up is genuinely for catching up.

---

## 5. Personalization Transparency System

### 5.1 Signal Types

```typescript
type SignalType =
  | 'shelf_save'          // saved item to shelf
  | 'helpful'             // tapped "helpful"
  | 'well_said'           // tapped "well said"
  | 'made_me_think'       // tapped "made me think"
  | 'skip_fast'           // scrolled past < 1 second (negative)
  | 'less_of_this'        // explicit "less of this" tap
  | 'more_from_creator'   // explicit "more from this creator"
  | 'shelf_adjacent'      // inferred from shelf topic
  | 'trusted_network'     // endorsed by followed users
  | 'session_satisfaction'// post-session check-in (positive)
  | 'session_regret'      // post-session check-in (negative)
  | 'civic_opt_in'        // user opted into civic content
  | 'serendipity_positive' // saved/engaged with a serendipity card
  | 'serendipity_negative' // explicitly dismissed a serendipity card
```

### 5.2 Signal Editing API

Every signal is user-editable via the "Why this?" panel:

```
DELETE /api/signals/:id          — deactivate a signal
PATCH  /api/signals/:id          — modify signal weight
GET    /api/signals?content=:id  — all signals for a content item
GET    /api/signals              — user's full signal graph (exportable)
```

Users can:
- Remove any individual signal
- Disable signal categories ("stop using late-night browsing as a signal")
- Export their full signal graph as JSON
- Reset all signals (nuclear option, requires confirmation)

---

## 6. Civic Lane System

### 6.1 Data Model Extensions

```sql
-- Civic Lane opt-in
CREATE TABLE civic_preferences (
  user_id            UUID PRIMARY KEY REFERENCES users(id),
  opted_in           BOOLEAN DEFAULT false,
  opted_in_at        TIMESTAMPTZ,
  balance_preference TEXT DEFAULT 'auto',  -- auto, left-lean, right-lean, center
  topics             TEXT[]                -- ['climate', 'elections', 'policy']
);

-- Content civic metadata (applied by creator or detected)
CREATE TABLE content_civic_metadata (
  content_id   UUID PRIMARY KEY REFERENCES content(id),
  label        TEXT,  -- opinion, reporting, first_hand, satire
  political_lean FLOAT,  -- -1.0 (left) to 1.0 (right), null if unclear
  claims       JSONB,   -- extracted claims for sourcing overlay
  source_url   TEXT
);
```

### 6.2 Balance Enforcement

In Civic Lane decks:
- System enforces ideological balance: no more than 60/40 split by political lean score
- This constraint is **visible to the user** and explained
- User can adjust balance preference in settings (not hidden)
- Harbor explicitly does not choose which political lean is "correct" — balance is structural, not editorial

---

## 7. Phase Roadmap

### Phase 1: Foundation (Months 1–6)
**Goal: A working, honest social network with the core loop — and the constitutional minimums in place from day one.**

#### Deliverables:
- [ ] Auth system (email + Apple/Google OAuth)
- [ ] User profiles (simple)
- [ ] Content creation: text posts, image posts, link sharing
- [ ] Intent selector (all 7 modes including Explore; Civic gated by opt-in)
- [ ] Deck engine v1 (chronological + basic shelf affinity, no ML yet)
- [ ] Bucket plan v1 (rule-based, not ML — but buckets exist from day one)
- [ ] 20-card finite deck with completion screen
- [ ] Baseline view switcher (Following-only chronological) — constitutional requirement, ships in P1
- [ ] Check-in system: satisfaction prompt (20–40% cohort sampling)
- [ ] Shelves: create, save, organize
- [ ] Follow system + community join
- [ ] "Why this?" panel (rule-based explanations for P1, with source bucket label)
- [ ] Share with friction (read-before-share, friend-first defaults, 3s cooldown on throttled)
- [ ] Basic arousal detection (keyword-based heuristics for P1, mapped to 3-band system)
- [ ] Moderation action + notice system (enforcement notices + appeal path) — constitutional requirement, ships in P1
- [ ] Ranking RFC tracking (internal tooling — even if no public-facing RFC yet)
- [ ] Versioned ranking configs (for rollback)
- [ ] Dark mode
- [ ] React Native app (iOS + Android)
- [ ] Next.js web app

#### Success metrics:
- Satisfied session rate > 60% (baseline)
- Average deck completion rate > 70%
- Check-in response rate > 40%
- Notice coverage rate > 95% (every reach-impacting action generates a notice)

#### Team: 3–5 engineers, 1 designer, 1 PM

---

### Phase 2: The Satisfaction Engine (Months 7–12)
**Goal: ML-powered personalization that genuinely serves the user, with full metrics infrastructure.**

#### Deliverables:
- [ ] Satisfaction model v1 (LightGBM, trained on P1 check-in data)
- [ ] Deck engine v2 (ML-ranked, intent-specific, Stage A–F pipeline)
- [ ] Arousal classifier v1 (fine-tuned transformer, 3-band system)
- [ ] Throttling system with amber UI
- [ ] Dogpile detector + auto-dampening (Hostile Reply Rate, Unique Piler Count, Dogpile Velocity)
- [ ] Serendipity budget (per-user configurable, intent-specific thresholds)
- [ ] Embedding-based shelf affinity
- [ ] Signal editing UI (full "Why this?" panel with editable signals)
- [ ] Civic Lane (opt-in, labeled content, balance enforcement, diversity disclosure)
- [ ] Regret Rate prompt (small rotating cohort, separate from satisfaction prompt)
- [ ] Mood Delta prompt (opt-in cohort)
- [ ] Community threads (scoped to shelves/topics)
- [ ] Creator analytics dashboard (save rate, helpful rate, satisfaction contribution — not follower counts)
- [ ] Relationship strength scoring
- [ ] Notification system (batched, calm, `--accent-primary` badges)
- [ ] Onboarding flow v2 (serendipity budget, civic opt-in, community joining)
- [ ] RFC process tooling (public RFC list, gating checklist, rollback triggers)
- [ ] Daily metrics dashboard (SSR, RR, AEI, dogpile rate, moderation queue)
- [ ] Automatic rollback triggers (wired to ranking config versioning from P1)
- [ ] First public transparency report

#### Success metrics (Metrics Standard Tier 1 + 2 gates):
- Satisfied session rate > 75%
- Regret rate < 10%
- AEI high-band exposure < 10% of deck items
- Dogpile incidents < baseline
- Civic Lane SSR = general SSR (no degradation)
- Appeal overturn rate < 20%

#### Team: 5–8 engineers, 1–2 ML engineers, 2 designers, 1 PM

---

### Phase 3: Scale & Ecosystem (Months 13–24)
**Goal: Sustainable platform with creator economy, full auditability, and healthy growth.**

#### Deliverables:
- [ ] Creator monetization (subscriptions, tips — no rage-bait incentives; creator dashboard is satisfaction-focused)
- [ ] Sponsored content system (labeled, in-deck, skippable, contextual only — no behavioral microtargeting)
- [ ] Community moderation tools (topic-bound communities, shelf-linked mod actions)
- [ ] Explore v2 (curated topic browsing, creator discovery, trending shelves — never trending posts)
- [ ] Direct messaging (intentional, not an anxiety driver)
- [ ] Group shelves (shared libraries for communities)
- [ ] Events (in-person and digital, scoped to communities)
- [ ] API for third-party clients
- [ ] Full data portability (export everything: posts, shelves, signals, session history, RFC history)
- [ ] Infrastructure migration to Kubernetes
- [ ] Satisfaction model v2 (user-specific models, multi-task learning)
- [ ] Arousal classifier v2 (multi-modal: text + image)
- [ ] Independent audit infrastructure (third-party compliance with Ranking Charter)
- [ ] Red-team test harness ("can this be gamed into outrage loops?" automated test suite)
- [ ] Funding transparency ledger (public)
- [ ] Quarterly external transparency report

#### Success metrics:
- Satisfied session rate > 80%
- Creator revenue sustainable without engagement farming
- Regret rate < 8%
- User data export usage > 5% (portability is actually used)
- Appeal overturn rate < 15% (moderation quality)
- Zero ranking changes shipped without a completed RFC

---

## 8. API Design

### 8.1 Key Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh

GET    /api/users/:id
PATCH  /api/users/me

POST   /api/sessions                  — start a session (returns intent options)
POST   /api/sessions/:id/deck         — request a deck for intent
POST   /api/sessions/:id/checkin      — submit satisfaction check-in
PATCH  /api/sessions/:id/end

GET    /api/decks/:id                 — fetch pre-generated deck
POST   /api/decks/:id/items/:pos/engage  — log engagement (save, skip, etc.)

GET    /api/shelves                   — user's shelves
POST   /api/shelves                   — create shelf
GET    /api/shelves/:id/items
POST   /api/shelves/:id/items         — save item to shelf
DELETE /api/shelves/:id/items/:itemId

GET    /api/content/:id
POST   /api/content                   — create content
GET    /api/content/:id/why           — get "Why this?" explanation
POST   /api/content/:id/share         — initiate share (triggers friction pipeline)

GET    /api/signals                   — user's signal graph
DELETE /api/signals/:id               — deactivate signal
GET    /api/signals/export            — full export (JSON)

POST   /api/follows
DELETE /api/follows/:id

GET    /api/explore/topics
GET    /api/explore/creators

GET    /api/civic/preferences
PATCH  /api/civic/preferences

POST   /api/content/:id/report         — report content
GET    /api/moderation/notices          — user's enforcement notices (author view)
POST   /api/moderation/appeals          — submit appeal
GET    /api/moderation/appeals/:id      — appeal status

GET    /api/ranking/rfcs                — public RFC list
GET    /api/ranking/rfcs/:id            — individual RFC detail
GET    /api/transparency                — public transparency report data (aggregated)
```

### 8.2 Deck Engagement Event Schema

```typescript
interface DeckEngagementEvent {
  deckId:      string;
  contentId:   string;
  position:    number;
  action:      'view' | 'save' | 'reply' | 'share' | 'skip' | 'helpful' |
               'well_said' | 'made_me_think' | 'less_of_this' |
               'why_this_opened' | 'throttle_shown' | 'throttle_dismissed';
  dwellMs?:    number;   // only for skip detection < 1000ms
  shelfId?:    string;   // if action is 'save'
  timestamp:   string;
}
```

---

## 9. ML Model Governance

### 9.1 What We Optimize For (Explicit)

The objective function for all ranking models must be auditable and written down. Current approved objectives:

```
Primary:   P(session_satisfaction = 1)
Secondary: P(shelf_save)
Tertiary:  P(helpful | well_said | made_me_think)
Penalized: high arousal_score, fast_skip_rate, regret_signal
```

**Banned objectives:**
```
NEVER: time_spent, return_to_app_rate, raw_share_count, rage_comment_count
```

### 9.2 Model Review Process (Satisfaction Gate)

Any material change to ranking objectives, signals, or constraints must pass all of the following before shipping globally:

1. **RFC submitted** — written rationale, what changes, why, tradeoffs, evaluation plan
2. **Arousal/manipulation audit** — "Could this signal be gamed to produce high-arousal content?"
3. **Randomized controlled experiment** — minimum 7-day runtime (14 preferred); sample sized via power analysis
4. **All gates must pass** (Metrics Standard tolerances):
   - SSR: non-decrease ≥ -2% relative
   - RR: non-increase ≥ +5% relative
   - AEI high-band: non-increase ≥ +5% relative
   - Dogpile incidents: non-worsening
   - Notice coverage: non-decrease ≥ -2pp
5. **Conflicting metrics block auto-ship** — e.g., SSR up but RR also up → manual review required
6. Approved signals documented in `/ml/signals/approved.md`

### 9.3 Red Lines

These are non-negotiable constraints in the ML system, enforced in code:

```python
# In deck_engine.py
assert deck.high_arousal_count <= 2, "Max 2 high-arousal items per deck (10% of 20)"
assert deck.high_arousal_consecutive == 0, "No consecutive high-arousal items"
if deck.intent in ("delight", "explore"):
    assert deck.high_arousal_count <= 1, "Stricter cap for Delight/Explore"
assert deck.serendipity_count <= (deck.size * user.serendipity_budget), "Serendipity cap exceeded"
assert all(i >= 3 for i in deck.serendipity_positions), "No serendipity in first 3 positions"
assert deck.civic_items_count == 0 or user.civic_opted_in, "Civic content requires opt-in"
assert deck.size <= 20, "Decks are finite"
assert deck.intent == session.selected_intent, "No cross-intent ranking"
assert all(item.explanation_reason_codes for item in deck.items), "Every item needs an explanation"
```

---

## 10. Privacy & Data Model

### 10.1 Data Minimization

| Data | Collected | Retention | Exportable |
|---|---|---|---|
| Session satisfaction scores | Yes | Forever | Yes |
| Shelf saves | Yes | Forever | Yes |
| User signal graph | Yes | Forever | Yes, full export |
| Deck item dwell time | Only < 1s skip detection | 30 days | No |
| Full reading time | Never collected | — | — |
| Location | Never collected | — | — |
| Device sensor data | Never collected | — | — |
| Ad targeting profile | Never built | — | — |

### 10.2 Portability

Users can export at any time:
- All posts they've created
- All shelf contents (with original content)
- Their signal graph (what Harbor knows about them)
- Session history and check-in data

Export format: JSON + human-readable HTML. Available within 24 hours of request.

### 10.3 Account Deletion

Full deletion within 30 days of request. Aggregated, non-identifiable data used for model training may be retained per privacy policy. User is told this explicitly.

---

## 11. Definition of Done (Quality Gates)

Before any feature ships:
- [ ] Passes arousal/manipulation audit ("can this be gamed to hijack attention?")
- [ ] Includes "Why this?" explainability if it involves personalization
- [ ] Source bucket label present on any ranked content surface
- [ ] Tested with reduced motion enabled
- [ ] WCAG AA contrast verified
- [ ] Dark mode implemented and verified
- [ ] Does not introduce a new red notification badge
- [ ] Does not remove a natural stopping point
- [ ] Does not remove or hide the baseline view switcher
- [ ] If it's a material ranking change: RFC is submitted, gating experiment is planned, rollback config is versioned
- [ ] If it touches moderation or enforcement: notice + appeal path confirmed
- [ ] Red-team check: "can this create a dogpile or outrage loop?"
- [ ] A/B test plan names satisfied session rate as primary success metric, regret rate as a constraint

---

## 12. Monitoring & Rollback Infrastructure

### 12.1 Real-Time Dashboard Requirements

The following must be queryable in real time (latency < 5 minutes):

- SSR (rolling 1h, 24h, 7d) — by intent, new vs. returning
- RR (rolling 1h, 24h, 7d)
- AEI high-band exposure % — by intent
- Dogpile Velocity incidents per 10k sessions
- Deck completion rate
- Notice Coverage Rate
- Active ranking config version

### 12.2 Automatic Rollback Triggers

Wired to the versioned ranking config system. If any of the following are sustained for 2+ hours vs. baseline:

```python
IMMEDIATE_ROLLBACK_CONDITIONS = [
    ("regret_rate_relative_change", ">=", 0.15),       # +15% relative
    ("aei_high_band_relative_change", ">=", 0.20),     # +20% relative
    ("dogpile_velocity_relative_change", ">=", 0.25),  # +25% relative
    ("notice_coverage_rate_drop", ">=", 0.10),         # -10pp absolute
]

FAST_ROLLBACK_CONDITIONS = [  # sustained 24h
    ("ssr_relative_change", "<=", -0.05),              # -5% relative
    ("worse_mood_relative_change", ">=", 0.10),        # +10% relative
    ("rapid_chaining_relative_change", ">=", 0.20),    # +20% relative + RR up
]
```

Rollback means: swap `is_active` to the prior `ranking_config_versions` record. The change is logged with `rolled_back_at` timestamp. An RFC update is required before re-attempting.

### 12.3 Experiment Infrastructure

- All A/B experiments use `GrowthBook` with user-level assignment (not session-level, to capture habit effects)
- Holdout group is always maintained (5% of users on prior config)
- Experiment results are stored against the RFC record for auditability
- No experiment runs longer than 30 days without an explicit extension review
