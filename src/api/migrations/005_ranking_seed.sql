-- ─── Seed: initial ranking RFC + active config version ───────────────────────
--
-- RFC-0001: Phase 1 deck engine — rule-based bucket plan
-- Config v1.0.0: establishes the baseline all future changes are measured against.
--
-- Rollback: SET is_active = false on v1.0.0, SET is_active = true on prior version.
-- There is no prior version — a rollback from v1.0.0 means a full redeploy.

INSERT INTO ranking_rfcs (
  id,
  title,
  description,
  what_changes,
  why,
  tradeoffs,
  evaluation_plan,
  status,
  submitted_at,
  shipped_at
) VALUES (
  'b1a00000-0000-0000-0000-000000000001',
  'RFC-0001: Phase 1 rule-based deck engine',
  'Establishes the baseline deck engine for Phase 1. No ML — pure rule-based bucket plan. Friends (followed users), discovery (all other users), shelves (saved items), and stub padding for sparse graphs.',
  'Initial implementation: bucket plan v1, 20-card finite deck, fixed shelf injection positions, keyword-heuristic arousal scoring, high-arousal constraint enforcement (≤2 per deck, non-consecutive).',
  'Constitutional requirement: a working, honest feed from day one. Rule-based ranking is auditable and explainable without ML infrastructure. Establishes the scoring baseline for Phase 2 satisfaction model training.',
  'Rule-based ranking cannot learn user preferences — all users get the same bucket weights regardless of behaviour. Serendipity is fixed at 15% with no per-user adjustment until Phase 2.',
  'Measure SSR >60%, deck completion >70%, check-in response >40% against Phase 1 success metrics. Track AEI distribution to confirm high-arousal cap is effective. Review at Phase 2 transition.',
  'shipped',
  NOW(),
  NOW()
);

INSERT INTO ranking_config_versions (
  version,
  config,
  rfc_id,
  deployed_at,
  is_active
) VALUES (
  '1.0.0',
  '{
    "deck_size": 20,
    "friend_limit": 8,
    "discovery_limit": 15,
    "shelf_positions": [3, 8, 13],
    "serendipity_budget": 0.15,
    "arousal_high_threshold": 0.67,
    "arousal_medium_threshold": 0.34,
    "high_arousal_max_per_deck": 2,
    "high_arousal_non_consecutive": true
  }',
  'b1a00000-0000-0000-0000-000000000001',
  NOW(),
  true
);
