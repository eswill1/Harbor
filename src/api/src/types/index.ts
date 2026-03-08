import { Pool } from 'pg'

// ─── Fastify instance augmentation ────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool
  }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Intent =
  | 'catch_up'
  | 'learn'
  | 'connect'
  | 'create'
  | 'delight'
  | 'explore'
  | 'civic'

export type ContentType = 'post' | 'article' | 'image' | 'video' | 'thread'

export type Engagement =
  | 'saved'
  | 'replied'
  | 'shared'
  | 'skipped'
  | 'helpful'
  | 'well_said'
  | 'made_me_think'
  | 'less_of_this'
  | 'throttle_shown'

export type ArousalBand = 'low' | 'medium' | 'high'

export type SignalType =
  | 'shelf_save'
  | 'helpful'
  | 'well_said'
  | 'made_me_think'
  | 'skip_fast'
  | 'less_of_this'
  | 'more_from_creator'
  | 'shelf_adjacent'
  | 'trusted_network'
  | 'session_satisfaction'
  | 'session_regret'
  | 'civic_opt_in'
  | 'serendipity_positive'
  | 'serendipity_negative'

// ─── DB row types ──────────────────────────────────────────────────────────────

export interface UserRow {
  id:           string
  handle:       string
  display_name: string
  created_at:   Date
  settings:     Record<string, unknown>
}

export interface SessionRow {
  id:           string
  user_id:      string
  intent:       Intent
  started_at:   Date
  ended_at:     Date | null
  deck_count:   number
  satisfaction: 1 | 2 | 3 | null
  mood_delta:   1 | 2 | 3 | null
}

export interface ContentRow {
  id:            string
  author_id:     string
  content_type:  ContentType
  body:          string | null
  media_urls:    unknown | null
  arousal_score: number | null
  created_at:    Date
  metadata:      Record<string, unknown>
}
