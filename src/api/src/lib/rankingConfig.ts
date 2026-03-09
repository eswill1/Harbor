import { Pool } from 'pg'

/**
 * The versioned ranking configuration.
 * All values that affect deck composition or content scoring live here.
 * Change via migration + RFC — never hardcode in routes.
 */
export interface RankingConfig {
  /** Total cards in a deck */
  deck_size:                    number
  /** Max posts fetched from followed users (friends bucket) */
  friend_limit:                 number
  /** Max posts fetched from non-followed users (discovery bucket) */
  discovery_limit:              number
  /** 0-indexed positions in the deck reserved for shelf items */
  shelf_positions:              number[]
  /** Fraction of deck that may be serendipity/adjacent-discovery content */
  serendipity_budget:           number
  /** arousal_score threshold for 'high' band */
  arousal_high_threshold:       number
  /** arousal_score threshold for 'medium' band (below = 'low') */
  arousal_medium_threshold:     number
  /** Max high-arousal cards allowed in a single deck */
  high_arousal_max_per_deck:    number
  /** Whether consecutive high-arousal cards are disallowed */
  high_arousal_non_consecutive: boolean
}

/** Fallback used if the DB has no active config row. Should never happen in production. */
export const DEFAULT_CONFIG: RankingConfig = {
  deck_size:                    20,
  friend_limit:                 8,
  discovery_limit:              15,
  shelf_positions:              [3, 8, 13],
  serendipity_budget:           0.15,
  arousal_high_threshold:       0.67,
  arousal_medium_threshold:     0.34,
  high_arousal_max_per_deck:    2,
  high_arousal_non_consecutive: true,
}

/**
 * Load the active ranking config from the DB.
 * Falls back to DEFAULT_CONFIG if no active row exists (should never happen post-seed).
 * DB values are merged over the default so new fields added to DEFAULT_CONFIG
 * are always present even for older config rows.
 */
export async function loadActiveConfig(db: Pool): Promise<RankingConfig & { version: string }> {
  const { rows } = await db.query<{ version: string; config: Partial<RankingConfig> }>(
    `SELECT version, config
       FROM ranking_config_versions
      WHERE is_active = true
      ORDER BY deployed_at DESC
      LIMIT 1`,
  )
  if (rows.length === 0) return { ...DEFAULT_CONFIG, version: 'default' }
  return { ...DEFAULT_CONFIG, ...rows[0].config, version: rows[0].version }
}
