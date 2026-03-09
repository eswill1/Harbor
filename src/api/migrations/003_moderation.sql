-- Harbor Moderation Migration
-- Migration 003 — Extended moderation: notices, reports, appeals linkage

-- ─── EXTEND moderation_actions ───────────────────────────────────────────────
-- Existing columns (from 001): id, content_id, user_id, action_type, label,
--   reason, policy_section, actioned_at, notice_sent, appeal_id

ALTER TABLE moderation_actions
  ADD COLUMN IF NOT EXISTS primary_reason_code    TEXT,
  ADD COLUMN IF NOT EXISTS secondary_reason_codes TEXT[],
  ADD COLUMN IF NOT EXISTS severity               TEXT CHECK (severity IN ('LOW','MED','HIGH','CRITICAL')),
  ADD COLUMN IF NOT EXISTS detection_source       TEXT CHECK (detection_source IN ('user_report','moderator','automated','trusted_reporter')),
  ADD COLUMN IF NOT EXISTS confidence             NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS evidence_refs          JSONB,
  ADD COLUMN IF NOT EXISTS target_user_id         UUID REFERENCES users(id);

-- ─── MODERATION NOTICES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moderation_notices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id           UUID NOT NULL REFERENCES moderation_actions(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  notice_type         TEXT NOT NULL CHECK (notice_type IN (
                        'content_labeled','content_interstitial','content_distribution_limited',
                        'content_removed','account_feature_limited','account_suspended',
                        'account_banned','appeal_outcome')),
  policy_section      TEXT NOT NULL,
  primary_reason_code TEXT NOT NULL,
  plain_summary       TEXT NOT NULL,
  affected_content_id UUID,
  affected_excerpt    TEXT,
  action_taken        TEXT NOT NULL,
  action_start        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_end          TIMESTAMPTZ,
  can_repost          BOOLEAN DEFAULT false,
  repost_instructions TEXT,
  delayed_notice      BOOLEAN DEFAULT false,
  delayed_reason      TEXT,
  delayed_until       TIMESTAMPTZ,
  appeal_deadline     TIMESTAMPTZ,
  appeal_id           UUID REFERENCES moderation_appeals(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_notices_user_id   ON moderation_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_notices_action_id ON moderation_notices(action_id);

-- ─── USER REPORTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES users(id),
  content_id       UUID,
  reported_user_id UUID REFERENCES users(id),
  reason           TEXT NOT NULL,
  detail           TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  action_id        UUID REFERENCES moderation_actions(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_content_id  ON user_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
