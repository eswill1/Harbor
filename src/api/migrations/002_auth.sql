-- Harbor Auth Migration
-- Migration 002 — Email/password auth + refresh tokens

-- Add email and password_hash to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Refresh tokens (stored as SHA-256 hash for security)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
-- Partial index for fast active-token lookups (non-revoked only)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
  ON refresh_tokens(token_hash)
  WHERE revoked_at IS NULL;
