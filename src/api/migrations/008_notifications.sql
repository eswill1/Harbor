-- ─── Migration 008: Notifications ────────────────────────────────────────────
--
-- In-app notifications for follow and shelf_save events.
-- Calm, batched, no push for Phase 2.
-- Types: follow | shelf_save  (reply added when replies ship)
--
-- Rollback: DROP TABLE notifications;

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,  -- recipient
  type       TEXT        NOT NULL CHECK (type IN ('follow', 'shelf_save')),
  actor_id   UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,  -- who did the action
  content_id UUID        REFERENCES content(id)           ON DELETE CASCADE,  -- null for follow
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

-- One follow notification per (recipient, follower) — re-follows don't spam
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_follow_dedup
  ON notifications(user_id, actor_id)
  WHERE type = 'follow';

-- One shelf_save notification per (recipient, saver, post) — re-saves don't spam
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_shelf_dedup
  ON notifications(user_id, actor_id, content_id)
  WHERE type = 'shelf_save';
