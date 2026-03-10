import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import * as cheerio from 'cheerio'
import { Pool } from 'pg'
import { isSafeUrl, extractYoutubeId } from '../lib/urlUtils'

/**
 * Link Scraper Worker
 *
 * Triggered at post creation when a URL is detected in the post body.
 * Fetches OG metadata and writes to link_previews table.
 *
 * SSRF-protected: blocks internal IP ranges before fetching.
 * Timeout: 5s. Max response: 1MB. Only text/html accepted.
 * Retries: 2 attempts before marking failed = true.
 *
 * Phase 3: add DNS-level SSRF check, cache image_url to R2.
 */

export const LINK_SCRAPER_QUEUE = 'link-scraper'

interface ScrapeJobData {
  contentId: string
  url:       string
}

export function startLinkScraper(db: Pool, redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = connection as any
  const queue      = new Queue(LINK_SCRAPER_QUEUE, {
    connection: conn,
    defaultJobOptions: {
      attempts: 2,
      backoff:  { type: 'fixed', delay: 3000 },
    },
  })

  const worker = new Worker<ScrapeJobData>(
    LINK_SCRAPER_QUEUE,
    async (job: Job<ScrapeJobData>) => {
      const { contentId, url } = job.data

      if (!isSafeUrl(url)) {
        console.warn(`[link-scraper] Blocked unsafe URL: ${url}`)
        await markFailed(db, contentId, url)
        return
      }

      let html: string
      try {
        const controller = new AbortController()
        const timeout    = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, {
          signal:  controller.signal,
          headers: { 'User-Agent': 'Harbor/1.0 (link preview bot)' },
        })
        clearTimeout(timeout)

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('text/html')) {
          await markFailed(db, contentId, url)
          return
        }

        // Cap at 1MB
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength > 1_048_576) {
          await markFailed(db, contentId, url)
          return
        }

        html = new TextDecoder().decode(buffer)
      } catch {
        await markFailed(db, contentId, url)
        return
      }

      // ── Parse OG tags ───────────────────────────────────────────────────────

      const $          = cheerio.load(html)
      const og         = (prop: string) => $(`meta[property="og:${prop}"]`).attr('content') ?? null
      const tw         = (name: string) => $(`meta[name="twitter:${name}"]`).attr('content') ?? null

      const title       = og('title')       ?? tw('title')       ?? ($('title').first().text().trim() || null)
      const description = og('description') ?? tw('description') ?? $('meta[name="description"]').attr('content') ?? null
      const imageUrl    = og('image')       ?? tw('image')       ?? null
      const siteName    = og('site_name')   ?? null
      const canonicalUrl = og('url')        ?? $('link[rel="canonical"]').attr('href') ?? url

      // Extract domain as fallback site name
      let domain: string | null = null
      try { domain = new URL(canonicalUrl).hostname.replace(/^www\./, '') } catch { /* ignore */ }

      // ── YouTube special case ────────────────────────────────────────────────

      const youtubeId   = extractYoutubeId(url)
      const isYoutube   = youtubeId !== null
      const finalImage  = isYoutube && !imageUrl
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : imageUrl

      await db.query(
        `INSERT INTO link_previews
           (content_id, url, canonical_url, title, description, image_url,
            site_name, preview_type, is_youtube, youtube_id, scraped_at, failed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), false)
         ON CONFLICT (content_id) DO UPDATE SET
           canonical_url = EXCLUDED.canonical_url,
           title         = EXCLUDED.title,
           description   = EXCLUDED.description,
           image_url     = EXCLUDED.image_url,
           site_name     = EXCLUDED.site_name,
           preview_type  = EXCLUDED.preview_type,
           is_youtube    = EXCLUDED.is_youtube,
           youtube_id    = EXCLUDED.youtube_id,
           scraped_at    = NOW(),
           failed        = false`,
        [
          contentId,
          url,
          canonicalUrl,
          title       ? title.slice(0, 500)       : null,
          description ? description.slice(0, 1000) : null,
          finalImage,
          siteName ?? domain,
          isYoutube ? 'video' : 'article',
          isYoutube,
          youtubeId,
        ],
      )
    },
    { connection: conn },
  )

  worker.on('failed', async (job, err) => {
    console.error(`[link-scraper] Job failed: ${err.message}`)
    if (job) await markFailed(db, job.data.contentId, job.data.url).catch(() => {})
  })

  return { queue, worker }
}

async function markFailed(db: Pool, contentId: string, url: string) {
  await db.query(
    `INSERT INTO link_previews (content_id, url, failed, scraped_at)
     VALUES ($1, $2, true, NOW())
     ON CONFLICT (content_id) DO UPDATE SET failed = true, scraped_at = NOW()`,
    [contentId, url],
  )
}
