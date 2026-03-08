-- Harbor Initial Schema
-- Migration 001 — Core tables
-- Aligned with IMPLEMENTATION_PLAN.md Section 2.2

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle       TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  settings     JSONB DEFAULT '{}'
);

-- ─── SHELVES ─────────────────────────────────────────────────────────────────

CREATE TABLE shelves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES shelves(id) ON DELETE SET NULL,
  embedding  vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTENT ─────────────────────────────────────────────────────────────────

CREATE TABLE content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN ('post', 'article', 'image', 'video', 'thread')),
  body          TEXT,
  media_urls    JSONB,
  embedding     vector(384),
  arousal_score FLOAT CHECK (arousal_score >= 0 AND arousal_score <= 1),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  metadata      JSONB DEFAULT '{}'
);

-- ─── SAVED ITEMS ─────────────────────────────────────────────────────────────

CREATE TABLE saved_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  shelf_id   UUID REFERENCES shelves(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  note       TEXT
);

-- ─── SESSIONS ────────────────────────────────────────────────────────────────

CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  intent       TEXT NOT NULL CHECK (intent IN ('catch_up', 'learn', 'connect', 'create', 'delight', 'explore', 'civic')),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  deck_count   INT DEFAULT 0,
  satisfaction SMALLINT CHECK (satisfaction IN (1, 2, 3)),  -- 1=yes, 2=sort_of, 3=no
  mood_delta   SMALLINT CHECK (mood_delta IN (1, 2, 3))     -- 1=better, 2=same, 3=worse
);

-- ─── DECK ITEMS ───────────────────────────────────────────────────────────────

CREATE TABLE deck_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id               UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content_id               UUID REFERENCES content(id) ON DELETE CASCADE,
  position                 SMALLINT NOT NULL,
  is_serendipity           BOOLEAN DEFAULT false,
  shown_at                 TIMESTAMPTZ,
  engagement               TEXT CHECK (engagement IN ('saved', 'replied', 'shared', 'skipped', 'helpful', 'well_said', 'made_me_think', 'less_of_this', 'throttle_shown')),
  dwell_ms                 INT,
  source_bucket            TEXT,
  arousal_band             TEXT CHECK (arousal_band IN ('low', 'medium', 'high')),
  explanation_reason_codes JSONB,
  bucket_plan_version      TEXT
);

-- ─── USER SIGNALS ─────────────────────────────────────────────────────────────

CREATE TABLE user_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  content_id  UUID REFERENCES content(id) ON DELETE CASCADE,
  shelf_id    UUID REFERENCES shelves(id) ON DELETE SET NULL,
  value       FLOAT DEFAULT 1.0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT true
);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────────

CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strength    FLOAT DEFAULT 1.0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

-- ─── MODERATION ──────────────────────────────────────────────────────────────

CREATE TABLE moderation_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     UUID REFERENCES content(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type    TEXT NOT NULL CHECK (action_type IN ('remove', 'label', 'restrict_distribution', 'warn')),
  label          TEXT,
  reason         TEXT NOT NULL,
  policy_section TEXT,
  actioned_at    TIMESTAMPTZ DEFAULT NOW(),
  notice_sent    BOOLEAN DEFAULT false,
  appeal_id      UUID
);

CREATE TABLE moderation_appeals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id       UUID REFERENCES moderation_actions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'upheld', 'overturned')),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT
);

-- Add FK from moderation_actions to appeals (circular, added after both exist)
ALTER TABLE moderation_actions
  ADD CONSTRAINT fk_appeal FOREIGN KEY (appeal_id) REFERENCES moderation_appeals(id) ON DELETE SET NULL;

-- ─── RANKING RFC & CONFIG ────────────────────────────────────────────────────

CREATE TABLE ranking_rfcs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  what_changes    TEXT NOT NULL,
  why             TEXT NOT NULL,
  tradeoffs       TEXT,
  evaluation_plan TEXT,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'shipped', 'rolled_back')),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  shipped_at      TIMESTAMPTZ,
  rolled_back_at  TIMESTAMPTZ
);

CREATE TABLE ranking_config_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT NOT NULL UNIQUE,
  config      JSONB NOT NULL,
  rfc_id      UUID REFERENCES ranking_rfcs(id) ON DELETE SET NULL,
  deployed_at TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT false
);

-- ─── CIVIC ───────────────────────────────────────────────────────────────────

CREATE TABLE civic_preferences (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  opted_in           BOOLEAN DEFAULT false,
  opted_in_at        TIMESTAMPTZ,
  balance_preference TEXT DEFAULT 'auto' CHECK (balance_preference IN ('auto', 'left-lean', 'right-lean', 'center')),
  topics             TEXT[]
);

CREATE TABLE content_civic_metadata (
  content_id     UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  label          TEXT CHECK (label IN ('opinion', 'reporting', 'first_hand', 'satire')),
  political_lean FLOAT CHECK (political_lean >= -1 AND political_lean <= 1),
  claims         JSONB,
  source_url     TEXT
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_content_author ON content(author_id);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_intent ON sessions(intent);
CREATE INDEX idx_deck_items_session ON deck_items(session_id);
CREATE INDEX idx_user_signals_user ON user_signals(user_id);
CREATE INDEX idx_user_signals_content ON user_signals(content_id);
CREATE INDEX idx_user_signals_active ON user_signals(user_id) WHERE is_active = true;
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_shelf ON saved_items(shelf_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_id);
CREATE INDEX idx_ranking_config_active ON ranking_config_versions(is_active) WHERE is_active = true;
