# Harbor Implementation Plan
### Version 1.2 — Aligned with Constitution v0.2 (includes Perspective §11), Design Bible v1.2, Metrics Standard, and Ranking Spec

---

## 0. Guiding Technical Principles

1. **The algorithm must be auditable.** Every ranking decision can be traced to an explicit signal. No black-box optimization.
2. **Satisfaction is a first-class metric.** The ML pipeline optimizes for session satisfaction scores, not engagement proxies.
3. **Privacy by architecture.** User signals are processed with minimum necessary data. Preference graphs stay user-controlled and exportable.
4. **Mobile-first, but not mobile-only.** Native mobile is the primary surface; web is a full peer.
5. **Scale later.** Build for quality first. Optimize for scale at Phase 4, not Phase 1.

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
| Styling | **NativeWind** | Token-based theming, dark mode, responsive — chosen over Shopify Restyle for consistency with Tailwind web stack |

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
| Message queue | **BullMQ (Redis-backed)** | Async jobs: deck generation, arousal scoring, satisfaction processing, OG link scraping |
| HTML parsing | **Cheerio** | Server-side OG/meta tag extraction for link preview scraper |
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
| Container orchestration | **Docker Compose (dev) → Docker Compose (VPS Phase 1-2) → Kubernetes (Phase 4)** |
| CI/CD | **GitHub Actions** |
| Secrets | **Doppler** |
| Observability | **OpenTelemetry → Grafana Cloud** |
| Error tracking | **Sentry** |
| Hosting (API/Web) | **Ionos VPS (2 vCPU, 2GB RAM, 80GB NVMe) Phase 1-2 → Fly.io Phase 3 → AWS/Azure Phase 4** |
| Database hosting | **Supabase (Phase 1-3) → RDS (Phase 4)** |
| Frontend hosting | **Next.js SSR on VPS behind existing reverse proxy (Phase 1-2) → Fly.io (Phase 3)** |

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

-- Link previews (scraped async at post creation — prerequisite for Perspective)
CREATE TABLE link_previews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID REFERENCES content(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,          -- original URL detected in post body
  canonical_url TEXT,                   -- og:url if present
  title         TEXT,                   -- og:title → <title> fallback
  description   TEXT,                   -- og:description → <meta description>
  image_url     TEXT,                   -- og:image (raw URL — cached to R2 in Phase 3)
  site_name     TEXT,                   -- og:site_name → domain fallback
  preview_type  TEXT DEFAULT 'article', -- article | video | website
  is_youtube    BOOLEAN DEFAULT false,
  youtube_id    TEXT,                   -- extracted for thumbnail (no API key needed)
  scraped_at    TIMESTAMPTZ,
  failed        BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
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

-- ─────────────────────────────────────────────────────────────────────
-- PERSPECTIVE: News context layer
-- WARNING: Data in these tables is PROHIBITED as a ranking signal.
-- Constitution §11: "Any Perspective table in the database schema is
-- considered a prohibited signal source for ranking."
-- ─────────────────────────────────────────────────────────────────────

-- Known outlet registry
CREATE TABLE perspective_outlets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain           TEXT UNIQUE NOT NULL,   -- e.g., "apnews.com"
  name             TEXT NOT NULL,          -- e.g., "Associated Press"
  rater_data       JSONB NOT NULL DEFAULT '{}',
  -- rater_data structure: { "allsides": { "lean": "center", "updated": "2026-01" },
  --   "mbfc": { "credibility": "high", "updated": "2026-01" },
  --   "newsguard": { "score": 92, "updated": "2026-01" } }
  reliability_tier TEXT NOT NULL DEFAULT 'not_enough_data',
  -- One of: established, generally_reliable, mixed, disputed, not_enough_data
  -- Derived from rater_data — never a single score, always a range
  data_version     TEXT NOT NULL,          -- semver; changes trigger RFC per §11
  last_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  rater_updated_at TIMESTAMPTZ             -- when source rater data was last refreshed
);

-- Coverage index: which outlets covered the same story as a given content item
-- framing_direction is CIVIC-GATED: only returned to clients when civic_opted_in = true
-- This gate is enforced in the API layer; the column must never be queried in ranking pipelines
CREATE TABLE perspective_coverage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  outlet_id         UUID REFERENCES perspective_outlets(id),
  coverage_url      TEXT,
  framing_direction TEXT,     -- 'left', 'center', 'right', 'unknown' — CIVIC-GATED in API
  detected_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_content_id, outlet_id)
);

-- User's Perspective lens preference (Civic Lane only)
-- Affects cross-coverage context pack selection only — NOT deck composition or ranking
CREATE TABLE perspective_user_lens (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  framing_preference TEXT NOT NULL DEFAULT 'all', -- 'all', 'left', 'center', 'right'
  set_at             TIMESTAMPTZ DEFAULT NOW()
);
-- ─────────────────────────────────────────────────────────────────────

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
0.67 – 0.89:  High — throttled (Broadcast Pause at share time, read-before-share, ≤2 per deck, non-consecutive; no in-feed amber indicator — see Design Bible §3.13)
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
→ Default options presented: "Share with a friend" / "Share to a group" / "Copy link"
→ If content has arousal_score > 0.7 (high band):
    → Broadcast Pause module shown (Design Bible §3.13):
        → "Share privately" (primary)
        → "Add a note" (secondary — note + optional source link, then share)
        → "Broadcast anyway" (tertiary — neutral confirmation, no timer)
    → No in-feed amber indicator, no countdown timer (backfire risk — Design Bible §7)
→ If link and user has not scrolled past article fold:
    → "You haven't read this yet" prompt (not blocking, just honest)
→ reason field is forward-compatible: high_arousal | civic_sensitive | rapid_virality | unknown
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

### 6.3 Perspective System

Perspective is the news context layer (Constitution §11, Design Bible §3.12). It is a read-only information layer — it cannot influence ranking, enforcement, or deck composition.

#### Architecture

```
Link card submitted / detected as news URL
   ↓
Domain normalizer → perspective_outlets lookup
   ↓ (if outlet found)
Reliability tier + rater_data fetched
   ↓
Coverage scan: check perspective_coverage for matching outlet entries
   ↓
API assembles PerspectivePanel response:
  - reliability_tier + rater_data (all users)
  - coverage dot list: outlet names only (all users)
  - framing_direction per dot: ONLY if session.civic_opted_in = true
```

#### Outlet Data Pipeline

Outlet data is updated on a scheduled basis — not in real time:
- Rater data (AllSides, MBFC, NewsGuard) is fetched and normalized nightly
- `data_version` is bumped on any schema or rater methodology change
- Version changes trigger an RFC per Constitution §11
- Outlet domain → outlet identity mapping errors can be reported by outlets; Harbor investigates and corrects verified mapping errors only (lean/reliability disputes go to the raters directly)

#### Coverage Detection

When a content item contains a news link:
1. Extract canonical domain from URL
2. Look up `perspective_outlets` by domain
3. Query a story-matching service (Phase 3: embedding similarity over recent articles from all known outlets) to find cross-coverage
4. Write matches to `perspective_coverage` with `framing_direction = null` initially; framing populated by the outlet's rater data for Civic-gated delivery
5. Results cached in Redis (TTL: 4 hours per story)

#### Ranking Firewall (non-negotiable)

The following is enforced in code and audited on every PR touching the deck engine or ML pipeline:

```python
# Constitution §11: Perspective data is a prohibited ranking signal
PROHIBITED_RANKING_FEATURES = [
    "perspective_outlets.*",
    "perspective_coverage.*",
    "perspective_user_lens.*",
    "outlet_reliability_tier",
    "outlet_framing_direction",
    "story_coverage_breadth",
    "framing_lean_score",
]
# Any use of these features in a ranking model is a material charter violation
# and requires immediate rollback + a constitutional review.
```

The single narrow exception: a user's `framing_preference` from `perspective_user_lens` may influence which cross-coverage articles appear in the **context pack reader** when the user taps "Read cross-coverage" inside Civic Lane. This is not a ranking signal — it is a UI filter on a secondary reader surface.

---

## 7. Phase Roadmap

### Phase 1: Foundation (Months 1–6)
**Goal: A working, honest social network with the core loop — and the constitutional minimums in place from day one.**

#### Deliverables:
- [x] Auth system — email/password registration + login, JWT access + refresh tokens _(OAuth: Phase 2)_
- [x] User profiles (simple)
- [x] Content creation: text posts _(image posts: Phase 3)_
- [x] Intent selector (all 7 modes including Explore; Civic gated by opt-in)
- [x] Deck engine v1 — friends bucket (follows), discovery bucket, stub padding for sparse graphs
- [x] Bucket plan v1 (rule-based, not ML — friends / discovery / shelves buckets live)
- [x] 20-card finite deck with completion screen
- [x] Baseline view switcher (Following-only chronological) — constitutional requirement ✓
- [x] Check-in system: satisfaction prompt on deck completion (cohort sampling: Phase 2)
- [x] Shelves: create, save, organize, inject into deck
- [x] Follow system + user profiles _(community join: Phase 2)_
- [x] "Why this?" panel (rule-based explanations — Modal bottom sheet, source bucket label + serendipity disclosure)
- [x] Share with friction (Broadcast Pause module: friend-first defaults, Add a note, Broadcast anyway — no countdown timer per Design Bible §3.13)
- [x] Basic arousal detection (keyword-based heuristics for P1, mapped to 3-band system)
- [x] Moderation action + notice system (enforcement notices + appeal path, admin role, community guidelines, enforcement taxonomy) — constitutional requirement ✓
- [x] Ranking RFC tracking (internal tooling — RFC-0001 seeded, admin endpoints live)
- [x] Versioned ranking configs (for rollback — ranking_config_versions table, is_active flag, deck engine reads from DB)
- [x] Dark mode (system + in-app System/Light/Dark toggle, persisted)
- [x] React Native app (iOS + Android) _(tested on device: iOS + Android tablet)_
- [x] Next.js web app _(auth, intent selector, deck, baseline feed, shelves, compose, profile, user profiles, notices + appeals)_

#### Success metrics:
- Satisfied session rate > 60% (baseline)
- Average deck completion rate > 70%
- Check-in response rate > 40%
- Notice coverage rate > 95% (every reach-impacting action generates a notice)

#### Team: 3–5 engineers, 1 designer, 1 PM

**✓ Phase 1 complete — 2026-03-10**

---

### Phase 2: Instrumentation & User Value (Months 7–12)
**Goal: Make the platform measurably better for users already on it — data collection, notifications, creator tools, and metrics visibility. No ML required, stays on VPS.**

#### Deliverables:
- [x] Regret Rate prompt (small rotating cohort, 15% of sessions — feeds Phase 3 ML training)
- [x] Automatic rollback triggers (BullMQ hourly job — RR > 10% over 24h window flips config version)
- [ ] Rich link previews (OG scraping, link_previews table, LinkPreviewCard component — prerequisite for Perspective)
  - URL detection at post creation → async BullMQ scrape job
  - `link_previews` table: title, description, image_url, site_name, canonical_url, is_youtube, youtube_id
  - YouTube special case: thumbnail from img.youtube.com, no API key
  - SSRF protection on scraper (block internal IP ranges)
  - Deck + feed API JOIN link_previews into card response
  - LinkPreviewCard component (mobile + web): OG image, site name, title, description
  - Composer live preview (800ms debounce, dismissable)
- [ ] Notification system (batched, calm, `--accent-primary` badges — follow, reply, shelf save)
- [ ] Mood Delta prompt (opt-in cohort)
- [ ] Daily metrics dashboard (SSR, RR, AEI, dogpile rate, moderation queue — admin-facing)
- [ ] Signal editing UI (full "Why this?" panel with editable signals)
- [ ] Creator analytics dashboard (save rate, helpful rate, satisfaction contribution — not follower counts)
- [ ] Relationship strength scoring (improves friends bucket quality)
- [ ] Serendipity budget (per-user configurable)
- [ ] Onboarding flow v2 (serendipity budget, civic opt-in, community joining)
- [ ] RFC process tooling (public RFC list, gating checklist, rollback triggers)

#### Success metrics:
- Regret rate < 10% (first measurement)
- Notification open rate > 30% (calm notifications actually get read)
- Creator analytics adoption > 50% of active creators
- Daily metrics dashboard live and reviewed weekly
- Zero ranking changes shipped without a completed RFC

#### Team: 2–3 engineers, 1 designer

---

### Phase 3: The Satisfaction Engine (Months 13–18)
**Goal: ML-powered personalization that genuinely serves the user. Migrate to Fly.io. Full metrics infrastructure.**

#### Deliverables:
- [ ] Satisfaction model v1 (LightGBM, trained on Phase 2 check-in + regret rate data)
- [ ] Deck engine v2 (ML-ranked, intent-specific, Stage A–F pipeline)
- [ ] Arousal classifier v1 (fine-tuned transformer, replaces keyword scorer — stable interface maintained)
- [ ] Throttling system auto-logic (Broadcast Pause UI already exists — Phase 3 adds automatic trigger)
- [ ] Dogpile detector + auto-dampening (Hostile Reply Rate, Unique Piler Count, Dogpile Velocity)
- [ ] Embedding-based shelf affinity (pgvector already installed)
- [ ] Civic Lane (opt-in, labeled content, balance enforcement, diversity disclosure)
- [ ] **Perspective v1** — outlet registry (initial seed: ~200 outlets), reliability tier display on all news link cards, coverage dot grid (non-Civic: neutral dots; Civic: framing-grouped dots), expanded Perspective panel, "What is Perspective?" explainer, rater attribution
- [ ] Perspective framing firewall tests — automated checks that Perspective tables never appear as ranking features
- [ ] Community threads (scoped to shelves/topics)
- [ ] Infrastructure migration to Fly.io
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

### Phase 4: Scale & Ecosystem (Months 19–30)
**Goal: Sustainable platform with creator economy, full auditability, and healthy growth.**

#### Deliverables:
- [ ] Creator monetization (subscriptions, tips — no rage-bait incentives; creator dashboard is satisfaction-focused)
- [ ] Sponsored content system (labeled, in-deck, skippable, contextual only — no behavioral microtargeting)
- [ ] Community moderation tools (topic-bound communities, shelf-linked mod actions)
- [ ] Explore v2 (curated topic browsing, creator discovery, trending shelves — never trending posts)
- [ ] Direct messaging — Signal Protocol E2EE, metadata minimization, no engagement mechanics (see §14)
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
GET    /api/civic/lens                        — user's Perspective lens preference (Civic only)
PATCH  /api/civic/lens                        — update lens preference

GET    /api/link-preview?url=                — fetch OG preview for composer live preview (auth required, SSRF-protected)

GET    /api/perspective/:contentId            — Perspective panel data for a news link card
       — returns: outlet name, reliability_tier, rater_data, coverage dot list
       — framing_direction per dot: only returned when requesting user has civic_opted_in = true
GET    /api/perspective/outlets/:domain       — single outlet lookup (for link-sharing preview)

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

# Constitution §11: Perspective data is a prohibited ranking signal
# Any use of these features triggers an immediate rollback and constitutional review
assert not any(f in model.feature_names for f in [
    "outlet_reliability_tier", "outlet_framing_direction",
    "story_coverage_breadth", "framing_lean_score",
    "perspective_outlet_id", "perspective_coverage_count",
]), "Perspective data must never appear as a ranking feature"
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
| Perspective lens preference | Yes (Civic opt-in users only) | Until user clears it | Yes |
| Perspective outlet/coverage data | Yes (shared, not user-specific) | Versioned; updated nightly | N/A (public context data) |

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

---

## 13. Repository, Licensing & Operations

### 13.1 License

Harbor is licensed under the **Business Source License 1.1 (BUSL-1.1)**.

- Non-commercial, personal, and development/testing use is permitted freely
- Commercial production use requires a commercial license from Ed Williams
- Change Date: **2030-01-01** — on that date the license converts to Apache 2.0
- Contributors grant a perpetual commercialization license per `CONTRIBUTING.md`

### 13.2 Monorepo Structure

```
Harbor/
├── src/
│   ├── api/        — Fastify 5 + TypeScript (port 4000)
│   ├── web/        — Next.js 15 App Router + Tailwind (port 3000 in container)
│   ├── mobile/     — Expo 52 + React Native 0.76 + NativeWind
│   └── ml/         — FastAPI + Python (Phase 3; stub only in Phase 1-2)
├── infra/
│   └── nginx/      — Nginx server configs (source of truth, deployed to VPS)
├── docker-compose.yml
├── doppler.yaml
└── package.json    — npm workspaces root (api, web, mobile)
```

### 13.3 Port Assignments

| Service | Container Port | Host Port | External URL |
|---|---|---|---|
| harbor-api | 4000 | 4000 (127.0.0.1 only) | https://api.dev.joinharbor.app |
| harbor-web | 3000 | 3001 (127.0.0.1 only) | https://dev.joinharbor.app |
| harbor-redis | 6379 | none (internal only) | — |
| harbor-typesense | 8108 | none (internal only) | — |

All host ports are bound to `127.0.0.1` — Nginx proxies external traffic, nothing is directly internet-accessible.

### 13.4 Subdomain Routing

API and web are on separate subdomains (not path-routed) because the mobile app calls the API directly. Path-routing would require mobile traffic to flow through the web server.

| Subdomain | Target | Rationale |
|---|---|---|
| `dev.joinharbor.app` | harbor-web (port 3001) | Next.js SSR web app |
| `api.dev.joinharbor.app` | harbor-api (port 4000) | Fastify API — called by web and mobile |

Production will mirror this pattern: `joinharbor.app` + `api.joinharbor.app`.

---

## 14. Messaging Architecture (Phase 4)

Harbor messaging implements Signal-level privacy as a constitutional requirement (Constitution §9). The server is a blind relay — it cannot read message contents.

### 14.1 Encryption Protocol

**Signal Protocol** (libsignal or equivalent open-source implementation):
- X3DH (Extended Triple Diffie-Hellman) for initial key agreement
- Double Ratchet for per-message forward secrecy
- One-time prekeys published to the server; server never holds private keys

### 14.2 Database Schema

```sql
-- Identity keys (public halves only — private keys never leave the device)
CREATE TABLE messaging_identity_keys (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  identity_key_pub TEXT NOT NULL,        -- base64 public identity key
  signed_prekey    TEXT NOT NULL,        -- current signed prekey (public)
  prekey_signature TEXT NOT NULL,
  registered_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- One-time prekeys (consumed on session init; replenished by client)
CREATE TABLE messaging_one_time_prekeys (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  key_id   INT NOT NULL,
  prekey   TEXT NOT NULL,               -- base64 public prekey
  UNIQUE (user_id, key_id)
);

-- Message envelopes (ciphertext only — server cannot decrypt)
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,        -- derived from sorted participant IDs
  ciphertext      TEXT NOT NULL,        -- base64 encrypted payload
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ           -- TTL; null = keep until deleted by user
);

-- Conversations (metadata only — no content)
CREATE TABLE conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_b UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_a, participant_b)
);
```

### 14.3 Key API Endpoints

```
GET    /api/messaging/keys/:userId          — fetch recipient's public keys (for session init)
POST   /api/messaging/keys/prekeys          — upload a batch of one-time prekeys
POST   /api/messaging/send                  — submit encrypted envelope for delivery
GET    /api/messaging/inbox                 — fetch pending envelopes (ciphertext only)
DELETE /api/messaging/messages/:id          — delete own message envelope
DELETE /api/messaging/conversations/:id     — delete conversation record
POST   /api/messaging/conversations/:id/block — block sender
```

### 14.4 What the Server Stores and Retains

| Data | Stored | Retention |
|---|---|---|
| Message ciphertext | Yes (relay only) | Until delivered + 30 days, or user deletes |
| Message plaintext | Never | — |
| Sender + recipient IDs | Yes (routing) | Until conversation deleted |
| Timestamps | Yes (sent, delivered) | Until conversation deleted |
| Read receipts | Only if both parties opt in | Until conversation deleted |
| Message length / media type | No | — |
| "Is typing" state | Only if both opt in, in-memory only | Not persisted |

### 14.5 Constitutional Compliance

- No unread badge counts surfaced on the app icon or main tab bar
- Message metadata not included in any ranking or personalization signal
- Full conversation deletion available at any time (both local and server-side)
- Encryption implementation uses auditable open-source libraries
- Read receipts and typing indicators are double-opt-in only

### 13.5 Secrets Management

All secrets are managed in **Doppler** (`harbor` project).

| Environment | Doppler Config | Used For |
|---|---|---|
| Staging (VPS) | `stg` | dev.joinharbor.app |
| Production | `prd` | joinharbor.app (Phase 3+) |
| Local dev | `dev` | individual developer machines |

The VPS authenticates via a scoped service token. No `.env` files on any server.

**Deploy command on VPS:**
```bash
cd /home/ed/harbor
doppler run -- docker compose up -d
```

### 13.6 Database — Supabase Staging

| Property | Value |
|---|---|
| Provider | Supabase (managed PostgreSQL) |
| PostgreSQL version | 17.6 |
| Extensions | pgvector (vector(384)) |
| Project URL | https://grylhrilyimbtlzaqqgp.supabase.co |
| Migrations | `src/api/migrations/` |
| Connection string | Stored in Doppler as `DATABASE_URL` (stg config) |

**Applied migrations:**
- `001_initial_schema.sql` — 14 tables, 14 indexes, pgvector enabled

**Running migrations:**
```bash
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
psql "$(doppler secrets get DATABASE_URL --project harbor --config stg --plain)" \
  -f src/api/migrations/NNN_name.sql
```

### 13.7 CI/CD — GitHub Actions

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. Checkout code on Actions runner
2. rsync to VPS (excludes `node_modules`, `.next`, `dist`, `.env`)
3. `docker compose build` on VPS
4. `doppler run -- docker compose up -d` on VPS
5. Health check: `https://api.dev.joinharbor.app/health` + `https://dev.joinharbor.app`

**Secrets stored in GitHub Actions:**

| Secret | Purpose |
|---|---|
| `VPS_SSH_PRIVATE_KEY` | Dedicated ED25519 deploy key (not the main admin key) |
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | VPS login user |

**Emergency manual deploy** (if Actions is unavailable):
```bash
rsync -az --delete \
  --exclude=node_modules --exclude=.next --exclude=dist \
  --exclude=.git --exclude=.DS_Store --exclude=.env \
  -e "ssh -i ~/.ssh/id_ed25519" \
  /Users/edwilliams/Projects/Harbor/ root@108.175.8.250:/home/ed/harbor/

ssh -i ~/.ssh/id_ed25519 root@108.175.8.250 \
  'cd /home/ed/harbor && docker compose build && doppler run -- docker compose up -d'
```
