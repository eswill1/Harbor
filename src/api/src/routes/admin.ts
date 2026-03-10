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

  // ── GET /api/admin/moderation/reports ─────────────────────────────────────

  app.get('/api/admin/moderation/reports', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { status = 'pending' } = request.query as { status?: string }

    const { rows } = await app.db.query<{
      id: string; reason: string; detail: string | null; status: string; created_at: Date
      reporter_id: string; reporter_handle: string; reporter_display_name: string
      content_id: string | null; content_body: string | null
      content_author_id: string | null; content_author_handle: string | null
      reported_user_id: string | null; reported_user_handle: string | null; reported_user_display_name: string | null
    }>(`
      SELECT
        r.id, r.reason, r.detail, r.status, r.created_at,
        rep.id   AS reporter_id, rep.handle AS reporter_handle, rep.display_name AS reporter_display_name,
        c.id     AS content_id, substring(c.body, 1, 200) AS content_body,
        ca.id    AS content_author_id, ca.handle AS content_author_handle,
        ru.id    AS reported_user_id, ru.handle AS reported_user_handle, ru.display_name AS reported_user_display_name
      FROM user_reports r
      JOIN users rep ON rep.id = r.reporter_id
      LEFT JOIN content  c  ON c.id  = r.content_id
      LEFT JOIN users   ca  ON ca.id = c.author_id
      LEFT JOIN users   ru  ON ru.id = r.reported_user_id
      WHERE r.status = $1
      ORDER BY r.created_at ASC
      LIMIT 100
    `, [status])

    return reply.send(rows.map(r => ({
      id:         r.id,
      reason:     r.reason,
      detail:     r.detail,
      status:     r.status,
      created_at: r.created_at,
      reporter: { id: r.reporter_id, handle: r.reporter_handle, display_name: r.reporter_display_name },
      content: r.content_id ? {
        id:     r.content_id,
        body:   r.content_body,
        author: { id: r.content_author_id, handle: r.content_author_handle },
      } : null,
      reported_user: r.reported_user_id ? {
        id:           r.reported_user_id,
        handle:       r.reported_user_handle,
        display_name: r.reported_user_display_name,
      } : null,
    })))
  })

  // ── PATCH /api/admin/moderation/reports/:id ───────────────────────────────
  // action: 'dismiss' | 'reviewed'

  app.patch('/api/admin/moderation/reports/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { id }     = request.params as { id: string }
    const { action } = request.body   as { action: unknown }

    if (action !== 'dismiss' && action !== 'reviewed') {
      return reply.badRequest('action must be "dismiss" or "reviewed"')
    }

    const newStatus = action === 'dismiss' ? 'dismissed' : 'reviewed'

    const result = await app.db.query(
      `UPDATE user_reports SET status = $1 WHERE id = $2 AND status = 'pending' RETURNING id`,
      [newStatus, id],
    )

    if (result.rowCount === 0) return reply.notFound('Report not found or already actioned')
    return reply.send({ ok: true, status: newStatus })
  })

  // ── POST /api/admin/moderation/reports/:id/action ─────────────────────────
  // Escalate a report to a full enforcement action + notice.

  app.post('/api/admin/moderation/reports/:id/action', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role, userId: callerId } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { id } = request.params as { id: string }

    const reportResult = await app.db.query<{
      id: string; content_id: string | null; reported_user_id: string | null; status: string
    }>('SELECT id, content_id, reported_user_id, status FROM user_reports WHERE id = $1', [id])

    if (reportResult.rows.length === 0) return reply.notFound('Report not found')
    const report = reportResult.rows[0]
    if (report.status !== 'pending' && report.status !== 'reviewed') {
      return reply.badRequest('Report is already actioned or dismissed')
    }

    const body = request.body as Record<string, unknown>
    const {
      action_type, reason, policy_section, primary_reason_code, severity,
      plain_summary, action_taken, action_end, can_repost, repost_instructions,
    } = body

    if (!['remove', 'label', 'restrict_distribution', 'warn'].includes(action_type as string)) {
      return reply.badRequest('Invalid action_type')
    }
    if (typeof reason !== 'string' || !reason.trim()) return reply.badRequest('reason is required')
    if (typeof plain_summary !== 'string' || !plain_summary.trim()) return reply.badRequest('plain_summary is required')
    if (typeof action_taken  !== 'string' || !action_taken.trim())  return reply.badRequest('action_taken is required')

    // Determine target user: reported_user or content author
    const targetUserId = report.reported_user_id ?? (report.content_id
      ? (await app.db.query<{ author_id: string }>(
          'SELECT author_id FROM content WHERE id = $1', [report.content_id]
        )).rows[0]?.author_id ?? null
      : null)

    if (!targetUserId) return reply.badRequest('Cannot determine target user for this report')

    const appealDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await app.db.query('BEGIN')
    try {
      const actionResult = await app.db.query<{ id: string }>(
        `INSERT INTO moderation_actions
           (content_id, user_id, action_type, reason, policy_section,
            primary_reason_code, severity, detection_source, target_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'moderator', $8)
         RETURNING id`,
        [report.content_id ?? null, callerId, action_type, reason, policy_section ?? null,
         primary_reason_code ?? null, severity ?? null, targetUserId],
      )
      const actionId = actionResult.rows[0].id

      await app.db.query(
        `INSERT INTO moderation_notices
           (action_id, user_id, notice_type, policy_section, primary_reason_code,
            plain_summary, affected_content_id, action_taken, action_end,
            can_repost, repost_instructions, appeal_deadline)
         VALUES ($1, $2, 'content_removed', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [actionId, targetUserId, policy_section ?? '', primary_reason_code ?? '',
         plain_summary, report.content_id ?? null, action_taken,
         action_end ?? null, can_repost ?? false, repost_instructions ?? null, appealDeadline],
      )

      await app.db.query(
        `UPDATE user_reports SET status = 'actioned', action_id = $1 WHERE id = $2`,
        [actionId, id],
      )

      await app.db.query('COMMIT')
      return reply.code(201).send({ ok: true, action_id: actionId })
    } catch (err) {
      await app.db.query('ROLLBACK')
      throw err
    }
  })

  // ── GET /api/admin/moderation/appeals ────────────────────────────────────

  app.get('/api/admin/moderation/appeals', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { rows } = await app.db.query<{
      id: string; submitted_at: Date; status: string; resolution_note: string | null; resolved_at: Date | null
      user_id: string; user_handle: string; user_display_name: string
      action_id: string; action_type: string; action_reason: string
      notice_id: string | null; notice_type: string | null; plain_summary: string | null
      affected_excerpt: string | null; policy_section: string | null
    }>(`
      SELECT
        ap.id, ap.submitted_at, ap.status, ap.resolution_note, ap.resolved_at,
        u.id   AS user_id, u.handle AS user_handle, u.display_name AS user_display_name,
        a.id   AS action_id, a.action_type, a.reason AS action_reason,
        mn.id  AS notice_id, mn.notice_type, mn.plain_summary,
        mn.affected_excerpt, mn.policy_section
      FROM moderation_appeals ap
      JOIN users u              ON u.id  = ap.user_id
      JOIN moderation_actions a ON a.id  = ap.action_id
      LEFT JOIN moderation_notices mn ON mn.action_id = ap.action_id AND mn.user_id = ap.user_id
        AND mn.notice_type != 'appeal_outcome'
      WHERE ap.status = 'pending'
      ORDER BY ap.submitted_at ASC
      LIMIT 100
    `)

    return reply.send(rows.map(r => ({
      id:           r.id,
      submitted_at: r.submitted_at,
      status:       r.status,
      user: { id: r.user_id, handle: r.user_handle, display_name: r.user_display_name },
      action: { id: r.action_id, action_type: r.action_type, reason: r.action_reason },
      notice: r.notice_id ? {
        id:               r.notice_id,
        notice_type:      r.notice_type,
        plain_summary:    r.plain_summary,
        affected_excerpt: r.affected_excerpt,
        policy_section:   r.policy_section,
      } : null,
    })))
  })

  // ── PATCH /api/admin/moderation/appeals/:id ───────────────────────────────
  // decision: 'uphold' | 'overturn'

  app.patch('/api/admin/moderation/appeals/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role, userId: callerId } = request.user
    if (role !== 'admin') return reply.forbidden('Admin access required')

    const { id } = request.params as { id: string }
    const { decision, resolution_note } = request.body as {
      decision: unknown; resolution_note?: unknown
    }

    if (decision !== 'uphold' && decision !== 'overturn') {
      return reply.badRequest('decision must be "uphold" or "overturn"')
    }

    const appealResult = await app.db.query<{
      id: string; action_id: string; user_id: string; status: string
    }>('SELECT id, action_id, user_id, status FROM moderation_appeals WHERE id = $1', [id])

    if (appealResult.rows.length === 0) return reply.notFound('Appeal not found')
    const appeal = appealResult.rows[0]
    if (appeal.status !== 'pending') return reply.badRequest('Appeal is already resolved')

    const note = typeof resolution_note === 'string' && resolution_note.trim()
      ? resolution_note.trim() : null

    // Fetch the original notice for metadata needed to create the outcome notice
    const noticeResult = await app.db.query<{
      id: string; policy_section: string; primary_reason_code: string; action_id: string
    }>(
      `SELECT id, policy_section, primary_reason_code, action_id
       FROM moderation_notices
       WHERE action_id = $1 AND user_id = $2 AND notice_type != 'appeal_outcome'
       ORDER BY created_at DESC LIMIT 1`,
      [appeal.action_id, appeal.user_id],
    )
    const origNotice = noticeResult.rows[0]

    await app.db.query('BEGIN')
    try {
      // Resolve the appeal
      const newStatus = decision === 'uphold' ? 'upheld' : 'overturned'
      await app.db.query(
        `UPDATE moderation_appeals
         SET status = $1, resolved_at = NOW(), resolution_note = $2
         WHERE id = $3`,
        [newStatus, note, id],
      )

      // If overturning: expire the original notice immediately
      if (decision === 'overturn') {
        await app.db.query(
          `UPDATE moderation_notices
           SET action_end = NOW()
           WHERE action_id = $1 AND user_id = $2 AND notice_type != 'appeal_outcome'`,
          [appeal.action_id, appeal.user_id],
        )
      }

      // Create appeal_outcome notice for the user
      const outcomeText = decision === 'uphold'
        ? 'We reviewed your appeal and upheld the original decision.'
        : 'We reviewed your appeal and overturned the original decision. The action has been removed.'
      const plainSummary = note ? `${outcomeText} Note: ${note}` : outcomeText

      await app.db.query(
        `INSERT INTO moderation_notices
           (action_id, user_id, notice_type, policy_section, primary_reason_code,
            plain_summary, action_taken, appeal_id)
         VALUES ($1, $2, 'appeal_outcome', $3, $4, $5, $6, $7)`,
        [
          appeal.action_id, appeal.user_id,
          origNotice?.policy_section   ?? '',
          origNotice?.primary_reason_code ?? '',
          plainSummary,
          decision === 'uphold' ? 'Appeal upheld — original action stands' : 'Appeal overturned — action removed',
          id,
        ],
      )

      await app.db.query('COMMIT')
      return reply.send({ ok: true, status: newStatus })
    } catch (err) {
      await app.db.query('ROLLBACK')
      throw err
    }
  })
}
