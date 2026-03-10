/**
 * Phase 1 keyword-heuristic arousal scorer.
 * Maps text → float [0, 1] representing estimated emotional intensity.
 *
 * Bands (aligned with IMPLEMENTATION_PLAN.md §3.3 and Metrics Standard AEI):
 *   Low    0.00 – 0.33
 *   Medium 0.34 – 0.66
 *   High   0.67 – 1.00
 *
 * Design constraint: this scorer is intentionally conservative. False positives
 * on the Broadcast Pause trigger carry a real UX cost (Design Bible §3.13, §7
 * backfire risk). A post must accumulate multiple independent signals to reach
 * the high band. False negatives (under-scoring) are preferable to false
 * positives (over-scoring).
 *
 * Phase 2 replaces this with a fine-tuned transformer classifier. The exported
 * function signature is the stable interface — swap the implementation only.
 */

interface Signal {
  pattern: RegExp
  weight:  number
}

// ─── Signal tables ────────────────────────────────────────────────────────────

// Core anger/outrage vocabulary — highest weight
const OUTRAGE: Signal[] = [
  { pattern: /\boutrage(ous|d)?\b/i,    weight: 0.20 },
  { pattern: /\bdisgusting\b/i,         weight: 0.20 },
  { pattern: /\bappalling\b/i,          weight: 0.20 },
  { pattern: /\binfuriating\b/i,        weight: 0.20 },
  { pattern: /\b(furious|enraged?)\b/i, weight: 0.20 },
  { pattern: /\bshocking\b/i,           weight: 0.15 },
  { pattern: /\bshameful\b/i,           weight: 0.15 },
  { pattern: /\bdisgrace(ful)?\b/i,     weight: 0.15 },
  { pattern: /\bspeechless\b/i,         weight: 0.15 },
  { pattern: /\bunacceptable\b/i,       weight: 0.15 },
  { pattern: /\breprehensible\b/i,      weight: 0.15 },
  { pattern: /\bhate\b/i,               weight: 0.12 },
  { pattern: /\b(screw|damn|hell)\b/i,  weight: 0.08 },
]

// Strong reaction phrases — compound patterns
const REACTION_PHRASES: Signal[] = [
  { pattern: /\bhow dare\b/i,                                    weight: 0.15 },
  { pattern: /\bi can'?t believe\b/i,                            weight: 0.15 },
  { pattern: /\bpeople are (furious|outraged|angry|livid)\b/i,   weight: 0.15 },
  { pattern: /\bthis is why\b/i,                                 weight: 0.10 },
  { pattern: /\bwake up\b/i,                                     weight: 0.08 },
]

// Urgency / alarm — moderate weight
const URGENCY: Signal[] = [
  { pattern: /\bno one (is|was) talking about\b/i,   weight: 0.10 },
  { pattern: /\bbreaking\b/i,                        weight: 0.10 },
  { pattern: /\burgent\b/i,                          weight: 0.10 },
  { pattern: /\bmust (read|see|watch|know)\b/i,      weight: 0.08 },
  { pattern: /\byou need to (know|see|read)\b/i,     weight: 0.08 },
  { pattern: /\bwhy (isn'?t anyone|nobody)\b/i,      weight: 0.08 },
  { pattern: /\bcrisis\b/i,                          weight: 0.08 },
  { pattern: /\bemergency\b/i,                       weight: 0.08 },
  { pattern: /\bwarning\b/i,                         weight: 0.06 },
]

// Divisive framing — only meaningful in combination with other signals
const DIVISIVE: Signal[] = [
  { pattern: /\bthe (far )?(left|right)\b/i,                         weight: 0.08 },
  { pattern: /\b(those|these) people\b/i,                            weight: 0.08 },
  { pattern: /\bthey (always|never) (do|say|claim|act)\b/i,          weight: 0.08 },
]

// Intensifier amplifiers — meaningful alongside an outrage/urgency signal
const AMPLIFIERS: Signal[] = [
  { pattern: /\b(absolutely|completely|totally) (wrong|unacceptable|insane|outrageous|disgusting|shameful)\b/i, weight: 0.10 },
  { pattern: /\b(so|extremely|deeply) (angry|upset|outraged|disturbed)\b/i,                                    weight: 0.10 },
]

// Rhetorical virality escalators — low weight alone
const ESCALATORS: Signal[] = [
  { pattern: /\bshare this\b/i,             weight: 0.06 },
  { pattern: /\bspread (this|the word)\b/i, weight: 0.06 },
  { pattern: /\beveryone needs to\b/i,      weight: 0.06 },
  { pattern: /\bpass this (on|along)\b/i,   weight: 0.06 },
]

const ALL_SIGNALS: Signal[] = [
  ...OUTRAGE,
  ...REACTION_PHRASES,
  ...URGENCY,
  ...DIVISIVE,
  ...AMPLIFIERS,
  ...ESCALATORS,
]

// ─── Continuous feature scorers ───────────────────────────────────────────────

function capsScore(text: string): number {
  const alpha = text.replace(/[^a-zA-Z]/g, '')
  if (alpha.length < 20) return 0   // too short to score reliably
  const upperCount   = (text.match(/[A-Z]/g) ?? []).length
  // Subtract one expected capital per ~40 chars (sentence starts)
  const expectedCaps = Math.ceil(text.length / 40)
  const excessCaps   = Math.max(0, upperCount - expectedCaps)
  const ratio        = excessCaps / alpha.length
  return Math.min(0.20, ratio * 1.5)
}

function punctuationScore(text: string): number {
  const exclamations = (text.match(/!/g) ?? []).length
  const questions    = (text.match(/\?/g) ?? []).length
  let score = 0
  if (exclamations >= 2) score += 0.08
  if (exclamations >= 4) score += 0.08
  if (questions    >= 3) score += 0.05
  return score
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Score a post's text for emotional arousal intensity.
 * Returns a float in [0, 1]. Bands: low < 0.34, medium < 0.67, high ≥ 0.67.
 *
 * Designed to be called synchronously at post-creation time.
 * Stable interface: Phase 2 drops in an ML classifier here.
 */
export function computeArousalScore(text: string): number {
  let score = 0

  for (const { pattern, weight } of ALL_SIGNALS) {
    if (pattern.test(text)) score += weight
  }

  score += capsScore(text)
  score += punctuationScore(text)

  return Math.min(1.0, Math.round(score * 1000) / 1000)  // 3 decimal places
}
