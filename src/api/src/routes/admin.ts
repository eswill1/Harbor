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
