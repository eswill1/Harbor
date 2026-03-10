-- ─── Migration 006: Regret Rate prompt + rollback event log ──────────────────
--
-- Adds regret response tracking to sessions (separate from satisfaction).
-- Adds ranking_rollback_events to log automatic config rollbacks.
--
-- Rollback: ALTER TABLE sessions DROP COLUMN regret, regret_prompted, config_version;
--           DROP TABLE ranking_rollback_events;

-- Track which sessions were in the regret cohort and their response
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS regret          SMALLINT CHECK (regret IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS regret_prompted BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS config_version  TEXT;

-- 1=no regret, 2=a little, 3=yes

-- Log of every automatic rollback triggered by the metrics monitor
CREATE TABLE IF NOT EXISTS ranking_rollback_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_metric TEXT        NOT NULL,  -- 'regret_rate', 'aei_high_band', etc.
  metric_value   FLOAT       NOT NULL,
  threshold      FLOAT       NOT NULL,
  window_hours   INT         NOT NULL,
  from_version   TEXT        NOT NULL,
  to_version     TEXT        NOT NULL,
  note           TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_config_version ON sessions(config_version);
CREATE INDEX IF NOT EXISTS idx_sessions_regret_prompted ON sessions(regret_prompted) WHERE regret_prompted = true;
