import { FastifyInstance } from 'fastify'
import { loadActiveConfig } from '../lib/rankingConfig'

/**
 * Admin routes — ranking config, RFC management, and metrics.
 * All routes require role === 'admin' in the JWT.
 *
 * GET  /api/admin/ranking-config          — active config + version
 * GET  /api/admin/ranking-config/history  — all config versions (newest first)
 * GET  /api/admin/ranking-rfcs            — all RFCs (newest first)
 * POST /api/admin/ranking-rfcs            — create a new RFC (draft status)
 * GET  /api/admin/metrics/regret          — regret rate over rolling window
 * GET  /api/admin/metrics/rollback-events — recent auto-rollback log
 */
export default async function adminRoutes(app: FastifyInstance) {

  // ── GET /api/admin/ranking-config ─────────────────────────────────────────

  app.get('/api/admin/ranking-config', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { rows } = await app.db.query(
      `SELECT rcv.id, rcv.version, rcv.config, rcv.deployed_at, rcv.is_active,
              r.id AS rfc_id, r.title AS rfc_title
         FROM ranking_config_versions rcv
         LEFT JOIN ranking_rfcs r ON r.id = rcv.rfc_id
        WHERE rcv.is_active = true
        ORDER BY rcv.deployed_at DESC
        LIMIT 1`,
    )

    if (rows.length === 0) return reply.notFound('No active ranking config')
    return reply.send(rows[0])
  })

  // ── GET /api/admin/ranking-config/history ──────────────────────────────────

  app.get('/api/admin/ranking-config/history', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { rows } = await app.db.query(
      `SELECT rcv.id, rcv.version, rcv.config, rcv.deployed_at, rcv.is_active,
              r.id AS rfc_id, r.title AS rfc_title
         FROM ranking_config_versions rcv
         LEFT JOIN ranking_rfcs r ON r.id = rcv.rfc_id
        ORDER BY rcv.deployed_at DESC`,
    )

    return reply.send(rows)
  })

  // ── GET /api/admin/ranking-rfcs ───────────────────────────────────────────

  app.get('/api/admin/ranking-rfcs', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { rows } = await app.db.query(
      `SELECT id, title, description, what_changes, why, tradeoffs,
              evaluation_plan, status, submitted_at, shipped_at, rolled_back_at
         FROM ranking_rfcs
        ORDER BY submitted_at DESC`,
    )

    return reply.send(rows)
  })

  // ── POST /api/admin/ranking-rfcs ──────────────────────────────────────────

  app.post('/api/admin/ranking-rfcs', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const body = request.body as Record<string, unknown>
    const { title, description, what_changes, why, tradeoffs, evaluation_plan } = body

    if (typeof title        !== 'string' || !title.trim())        return reply.badRequest('title is required')
    if (typeof what_changes !== 'string' || !what_changes.trim()) return reply.badRequest('what_changes is required')
    if (typeof why          !== 'string' || !why.trim())          return reply.badRequest('why is required')

    const { rows } = await app.db.query(
      `INSERT INTO ranking_rfcs
         (title, description, what_changes, why, tradeoffs, evaluation_plan, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [title, description ?? null, what_changes, why, tradeoffs ?? null, evaluation_plan ?? null],
    )

    reply.code(201)
    return reply.send(rows[0])
  })

  // ── GET /api/admin/metrics/regret ─────────────────────────────────────────

  app.get('/api/admin/metrics/regret', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const config      = await loadActiveConfig(app.db)
    const windowStart = new Date(Date.now() - config.rollback_window_hours * 60 * 60 * 1000)

    const { rows } = await app.db.query(
      `SELECT
         COUNT(*)                                    AS total_prompted,
         COUNT(*) FILTER (WHERE regret IS NOT NULL)  AS total_responded,
         COUNT(*) FILTER (WHERE regret = 1)          AS no_regret,
         COUNT(*) FILTER (WHERE regret = 2)          AS some_regret,
         COUNT(*) FILTER (WHERE regret = 3)          AS full_regret,
         ROUND(
           COUNT(*) FILTER (WHERE regret = 3)::numeric /
           NULLIF(COUNT(*) FILTER (WHERE regret IS NOT NULL), 0) * 100,
           1
         ) AS regret_rate_pct
       FROM sessions
       WHERE regret_prompted = true
         AND ended_at >= $1`,
      [windowStart],
    )

    return reply.send({
      window_hours:  config.rollback_window_hours,
      threshold_pct: config.regret_rate_rollback_threshold * 100,
      config_version: config.version,
      ...rows[0],
    })
  })

  // ── GET /api/admin/metrics/summary ───────────────────────────────────────
  // Combined dashboard payload: SSR, RR, activity counts, moderation queue,
  // active ranking config.

  app.get('/api/admin/metrics/summary', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const config = await loadActiveConfig(app.db)
    const rrWindowStart = new Date(Date.now() - config.rollback_window_hours * 60 * 60 * 1000)
    const now24h        = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const now7d         = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)

    const [ssrRows, rrRows, activityRows, modRows] = await Promise.all([
      // SSR: satisfaction=1 ("yes") / all responded, for 24h and 7d
      app.db.query<{
        ssr_24h_responded: string; ssr_24h_satisfied: string
        ssr_7d_responded:  string; ssr_7d_satisfied:  string
        sessions_24h: string; sessions_7d: string
        completed_24h: string; completed_7d: string
      }>(`
        SELECT
          COUNT(*) FILTER (WHERE started_at >= $1 AND satisfaction IS NOT NULL) AS ssr_24h_responded,
          COUNT(*) FILTER (WHERE started_at >= $1 AND satisfaction = 1)         AS ssr_24h_satisfied,
          COUNT(*) FILTER (WHERE started_at >= $2 AND satisfaction IS NOT NULL) AS ssr_7d_responded,
          COUNT(*) FILTER (WHERE started_at >= $2 AND satisfaction = 1)         AS ssr_7d_satisfied,
          COUNT(*) FILTER (WHERE started_at >= $1)                              AS sessions_24h,
          COUNT(*) FILTER (WHERE started_at >= $2)                              AS sessions_7d,
          COUNT(*) FILTER (WHERE started_at >= $1 AND satisfaction IS NOT NULL) AS completed_24h,
          COUNT(*) FILTER (WHERE started_at >= $2 AND satisfaction IS NOT NULL) AS completed_7d
        FROM sessions
      `, [now24h, now7d]),

      // RR: same as existing /metrics/regret endpoint
      app.db.query<{
        total_prompted: string; total_responded: string
        no_regret: string; some_regret: string; full_regret: string
        regret_rate_pct: string | null
      }>(`
        SELECT
          COUNT(*)                                    AS total_prompted,
          COUNT(*) FILTER (WHERE regret IS NOT NULL)  AS total_responded,
          COUNT(*) FILTER (WHERE regret = 1)          AS no_regret,
          COUNT(*) FILTER (WHERE regret = 2)          AS some_regret,
          COUNT(*) FILTER (WHERE regret = 3)          AS full_regret,
          ROUND(
            COUNT(*) FILTER (WHERE regret = 3)::numeric /
            NULLIF(COUNT(*) FILTER (WHERE regret IS NOT NULL), 0) * 100, 1
          ) AS regret_rate_pct
        FROM sessions
        WHERE regret_prompted = true AND ended_at >= $1
      `, [rrWindowStart]),

      // Activity: posts and new users in 24h / 7d
      app.db.query<{
        posts_24h: string; posts_7d: string
        users_24h: string; users_7d: string
      }>(`
        SELECT
          COUNT(*) FILTER (WHERE c.created_at >= $1) AS posts_24h,
          COUNT(*) FILTER (WHERE c.created_at >= $2) AS posts_7d,
          (SELECT COUNT(*) FROM users WHERE created_at >= $1) AS users_24h,
          (SELECT COUNT(*) FROM users WHERE created_at >= $2) AS users_7d
        FROM content c
        WHERE c.content_type IN ('post', 'article')
      `, [now24h, now7d]),

      // Moderation queue: pending reports + unread notices (users who haven't read yet)
      app.db.query<{ pending_reports: string; pending_appeals: string }>(`
        SELECT
          (SELECT COUNT(*) FROM user_reports    WHERE status = 'pending') AS pending_reports,
          (SELECT COUNT(*) FROM moderation_appeals WHERE status = 'pending') AS pending_appeals
      `),
    ])

    const ssr = ssrRows.rows[0]
    const rr  = rrRows.rows[0]
    const act = activityRows.rows[0]
    const mod = modRows.rows[0]

    const ssr24hPct = Number(ssr.ssr_24h_responded) > 0
      ? Math.round(Number(ssr.ssr_24h_satisfied) / Number(ssr.ssr_24h_responded) * 100)
      : null
    const ssr7dPct = Number(ssr.ssr_7d_responded) > 0
      ? Math.round(Number(ssr.ssr_7d_satisfied) / Number(ssr.ssr_7d_responded) * 100)
      : null

    return reply.send({
      generated_at: new Date().toISOString(),
      ssr: {
        pct_24h:      ssr24hPct,
        pct_7d:       ssr7dPct,
        responded_24h: Number(ssr.ssr_24h_responded),
        responded_7d:  Number(ssr.ssr_7d_responded),
        threshold_pct: 60,
      },
      regret_rate: {
        pct:               rr.regret_rate_pct !== null ? Number(rr.regret_rate_pct) : null,
        total_prompted:    Number(rr.total_prompted),
        total_responded:   Number(rr.total_responded),
        window_hours:      config.rollback_window_hours,
        threshold_pct:     config.regret_rate_rollback_threshold * 100,
      },
      sessions: {
        total_24h:     Number(ssr.sessions_24h),
        total_7d:      Number(ssr.sessions_7d),
        completed_24h: Number(ssr.completed_24h),
        completed_7d:  Number(ssr.completed_7d),
      },
      content: {
        posts_24h: Number(act.posts_24h),
        posts_7d:  Number(act.posts_7d),
      },
      users: {
        new_24h: Number(act.users_24h),
        new_7d:  Number(act.users_7d),
      },
      moderation: {
        pending_reports: Number(mod.pending_reports),
        pending_appeals: Number(mod.pending_appeals),
      },
      ranking_config: {
        version: config.version,
      },
    })
  })

  // ── GET /api/admin/metrics/rollback-events ────────────────────────────────

  app.get('/api/admin/metrics/rollback-events', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { rows } = await app.db.query(
      `SELECT * FROM ranking_rollback_events ORDER BY triggered_at DESC LIMIT 50`,
    )

    return reply.send(rows)
  })
}
