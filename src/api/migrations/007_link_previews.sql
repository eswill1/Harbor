-- ─── Migration 007: Link previews ────────────────────────────────────────────
--
-- Stores scraped OG metadata for posts containing URLs.
-- Scraped async via BullMQ link-scraper queue at post creation time.
-- Prerequisite for Perspective v1 (domain → outlet registry lookup in Phase 3).
--
-- Rollback: DROP TABLE link_previews;

CREATE TABLE IF NOT EXISTS link_previews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID        NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  url           TEXT        NOT NULL,           -- original URL detected in post body
  canonical_url TEXT,                           -- og:url if present
  title         TEXT,                           -- og:title → <title> fallback
  description   TEXT,                           -- og:description → <meta description>
  image_url     TEXT,                           -- og:image (raw; cached to R2 in Phase 3)
  site_name     TEXT,                           -- og:site_name → domain fallback
  preview_type  TEXT        DEFAULT 'article',  -- article | video | website
  is_youtube    BOOLEAN     DEFAULT false,
  youtube_id    TEXT,                           -- extracted video ID (no API key needed)
  scraped_at    TIMESTAMPTZ,
  failed        BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_link_previews_content ON link_previews(content_id);
CREATE INDEX        IF NOT EXISTS idx_link_previews_domain  ON link_previews(( split_part(canonical_url, '/', 3) ));
