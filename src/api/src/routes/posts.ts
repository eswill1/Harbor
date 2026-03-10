import { FastifyInstance } from 'fastify'
import { computeArousalScore } from '../lib/arousal'
import { extractFirstUrl, isSafeUrl, extractYoutubeId } from '../lib/urlUtils'
import { LINK_SCRAPER_QUEUE } from '../workers/linkScraper'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import * as cheerio from 'cheerio'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostRow {
  id:           string
  body:         string
  created_at:   Date
  author_id:    string
  handle:       string
  display_name: string
  lp_url:           string | null
  lp_canonical_url: string | null
  lp_title:         string | null
  lp_description:   string | null
  lp_image_url:     string | null
  lp_site_name:     string | null
  lp_is_youtube:    boolean | null
  lp_youtube_id:    string | null
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function postRoutes(app: FastifyInstance) {

  const redisConn = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scraperQueue = new Queue(LINK_SCRAPER_QUEUE, { connection: redisConn as any })

  // ── POST /api/posts — create a text post ───────────────────────────────────

  app.post('/api/posts', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const body    = (request.body as Record<string, unknown>)
    const content = body?.content

    if (typeof content !== 'string' || content.trim().length === 0) {
      return reply.badRequest('content must be a non-empty string')
    }
    if (content.length > 500) {
      return reply.badRequest('content must be 500 characters or fewer')
    }

    const { userId }     = request.user
    const arousalScore   = computeArousalScore(content)
    const detectedUrl    = extractFirstUrl(content)
    const contentType    = detectedUrl ? 'article' : 'post'

    const { rows } = await app.db.query<{ id: string; body: string; created_at: Date; author_id: string }>(
      `INSERT INTO content (author_id, content_type, body, arousal_score)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, created_at, author_id`,
      [userId, contentType, content, arousalScore],
    )

    const post = rows[0]

    // Queue async OG scrape if a URL was detected
    if (detectedUrl && isSafeUrl(detectedUrl)) {
      await scraperQueue.add('scrape', { contentId: post.id, url: detectedUrl })
    }

    const userResult = await app.db.query<{ id: string; handle: string; display_name: string }>(
      'SELECT id, handle, display_name FROM users WHERE id = $1',
      [userId],
    )
    const author = userResult.rows[0]

    reply.code(201)
    return {
      id:         post.id,
      body:       post.body,
      created_at: post.created_at,
      author: {
        id:           author.id,
        handle:       author.handle,
        display_name: author.display_name,
      },
    }
  })

  // ── POST /api/posts/:id/share — log a share event ─────────────────────────

  app.post('/api/posts/:id/share', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const body       = request.body as Record<string, unknown>
    const shareType  = body?.share_type

    if (!['friend', 'group', 'copy_link'].includes(shareType as string)) {
      return reply.badRequest('share_type must be friend, group, or copy_link')
    }

    const { userId } = request.user

    const { rowCount } = await app.db.query(
      `SELECT 1 FROM content WHERE id = $1 AND content_type = 'post'`,
      [id],
    )
    if (!rowCount) return reply.notFound('Post not found')

    await app.db.query(
      `INSERT INTO user_signals (user_id, signal_type, content_id) VALUES ($1, $2, $3)`,
      [userId, `share_${shareType}`, id],
    )

    return { ok: true }
  })

  // ── GET /api/posts/feed — latest 50 posts with link previews ──────────────

  app.get('/api/posts/feed', {
    preHandler: [app.authenticate],
  }, async (_request, reply) => {
    const { rows } = await app.db.query<PostRow>(
      `SELECT c.id, c.body, c.created_at,
              u.id AS author_id, u.handle, u.display_name,
              lp.url           AS lp_url,
              lp.canonical_url AS lp_canonical_url,
              lp.title         AS lp_title,
              lp.description   AS lp_description,
              lp.image_url     AS lp_image_url,
              lp.site_name     AS lp_site_name,
              lp.is_youtube    AS lp_is_youtube,
              lp.youtube_id    AS lp_youtube_id
       FROM content c
       JOIN users u ON u.id = c.author_id
       LEFT JOIN link_previews lp ON lp.content_id = c.id AND lp.failed = false
       WHERE c.content_type IN ('post', 'article')
       ORDER BY c.created_at DESC
       LIMIT 50`,
    )

    return reply.send(rows.map(row => ({
      id:         row.id,
      body:       row.body,
      created_at: row.created_at,
      author: {
        id:           row.author_id,
        handle:       row.handle,
        display_name: row.display_name,
      },
      link_preview: row.lp_url ? {
        url:           row.lp_url,
        canonical_url: row.lp_canonical_url,
        title:         row.lp_title,
        description:   row.lp_description,
        image_url:     row.lp_image_url,
        site_name:     row.lp_site_name,
        is_youtube:    row.lp_is_youtube ?? false,
        youtube_id:    row.lp_youtube_id,
      } : null,
    })))
  })

  // ── GET /api/link-preview — composer live preview (SSRF-protected) ─────────

  app.get('/api/link-preview', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { url } = request.query as { url?: string }

    if (!url || typeof url !== 'string') return reply.badRequest('url is required')
    if (!isSafeUrl(url)) return reply.forbidden('URL is not allowed')

    try {
      const controller = new AbortController()
      const timeout    = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        signal:  controller.signal,
        headers: { 'User-Agent': 'Harbor/1.0 (link preview bot)' },
      })
      clearTimeout(timeout)

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) return reply.send({ ok: false })

      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 1_048_576) return reply.send({ ok: false })

      const html        = new TextDecoder().decode(buffer)
      const $           = cheerio.load(html)
      const og          = (prop: string) => $(`meta[property="og:${prop}"]`).attr('content') ?? null
      const tw          = (name: string) => $(`meta[name="twitter:${name}"]`).attr('content') ?? null

      const youtubeId   = extractYoutubeId(url)
      const isYoutube   = youtubeId !== null

      let domain: string | null = null
      try { domain = new URL(url).hostname.replace(/^www\./, '') } catch { /* ignore */ }

      const imageUrl = og('image') ?? tw('image') ?? null
      const finalImage = isYoutube && !imageUrl
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : imageUrl

      return reply.send({
        ok:   true,
        url,
        title:         og('title')       ?? tw('title')       ?? ($('title').first().text().trim() || null),
        description:   og('description') ?? tw('description') ?? $('meta[name="description"]').attr('content') ?? null,
        image_url:     finalImage,
        site_name:     og('site_name')   ?? domain,
        canonical_url: og('url')         ?? url,
        is_youtube:    isYoutube,
        youtube_id:    youtubeId,
      })
    } catch {
      return reply.send({ ok: false })
    }
  })
}
