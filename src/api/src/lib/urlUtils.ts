/**
 * URL detection and SSRF protection utilities for the link scraper.
 */

// Matches the first http/https URL in a string
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i

/** Extract the first URL from a post body. Returns null if none found. */
export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_PATTERN)
  return match ? match[0].replace(/[.,;!?)]+$/, '') : null  // strip trailing punctuation
}

/** YouTube video ID extraction — handles watch?v= and youtu.be/ formats */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Private IP ranges that must never be fetched (SSRF protection)
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '[::]', '::1'])

const PRIVATE_IP_PATTERNS = [
  /^127\./,          // loopback
  /^10\./,           // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,     // RFC 1918
  /^169\.254\./,     // link-local (AWS metadata, etc.)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // shared address space
  /^::1$/,           // IPv6 loopback
  /^fc/,             // IPv6 unique local
  /^fd/,             // IPv6 unique local
]

/**
 * Returns true if the URL is safe to fetch (not a private/internal address).
 * Checks hostname only — no DNS resolution. Add DNS-level check in Phase 3.
 */
export function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false

  const hostname = parsed.hostname.toLowerCase()

  if (BLOCKED_HOSTNAMES.has(hostname)) return false

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) return false
  }

  return true
}
