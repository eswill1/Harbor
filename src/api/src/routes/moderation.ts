/**
 * Moderation routes — notices, appeals, reports, admin actions
 *
 * TEST PLAN (manual, requires a running API + DB):
 *
 * 1. POST /api/moderation/actions (as admin)
 *    Body: { user_id: "<target>", action_type: "warn", reason: "test",
 *            policy_section: "3.1", primary_reason_code: "harassment",
 *            severity: "LOW", detection_source: "moderator",
 *            notice: { notice_type: "content_labeled", plain_summary: "Your content was labeled.",
 *                      action_taken: "labeled", policy_section: "3.1",
 *                      primary_reason_code: "harassment" } }
 *    Expected: 201 { action_id, notice_id }
 *
 * 2. GET /api/moderation/notices (as the target user)
 *    Expected: { notices: [{ id, notice_type: "content_labeled", ... }], total: 1 }
 *    Check: delivered_at is now set on that notice
 *
 * 3. GET /api/moderation/notices/:id (as the target user)
 *    Expected: single notice object
 *    Check: read_at is now set on the notice
 *
 * 4. POST /api/moderation/appeals (as the target user)
 *    Body: { notice_id: "<notice_id>", statement: "I didn't do anything wrong." }
 *    Expected: 201 { appeal_id }
 *
 * 5. GET /api/moderation/appeals/:id (as the target user)
 *    Expected: { id, status: "pending", submitted_at, outcome_note: null }
 *
 * 6. POST /api/moderation/appeals again with same notice_id (as the target user)
 *    Expected: 409 Conflict (notice already has an appeal)
 *
 * 7. POST /api/moderation/reports (as any authenticated user)
 *    Body: { reported_user_id: "<some_user>", reason: "spam", detail: "Lots of spam posts." }
 *    Expected: 201 { report_id }
 *
 * 8. GET /api/moderation/notices (as a different user who has no notices)
 *    Expected: { notices: [], total: 0 }
 *    Confirm: other user's notices are never returned
 */

import { FastifyInstance } from "fastify"

// ─── Types ────────────────────────────────────────────────────────────────────

type NoticeType =
  | "content_labeled"
  | "content_interstitial"
  | "content_distribution_limited"
  | "content_removed"
  | "account_feature_limited"
  | "account_suspended"
  | "account_banned"
  | "appeal_outcome"

type Notice = {
  id:                  string
  action_id:           string
  notice_type:         NoticeType
  policy_section:      string
  primary_reason_code: string
  plain_summary:       string
  affected_content_id: string | null
  affected_excerpt:    string | null
  action_taken:        string
  action_start:        string
  action_end:          string | null
  can_repost:          boolean
  repost_instructions: string | null
  appeal_deadline:     string | null
  appeal_id:           string | null
  read_at:             string | null
  created_at:          string
}

interface NoticeRow extends Notice {
  delivered_at: string | null
}

interface AppealRow {
  id:              string
  status:          string
  submitted_at:    string
  resolution_note: string | null
}

interface CountRow {
  total: string
}

const VALID_REASONS = new Set([
  "harassment", "hate", "spam", "graphic", "sexual", "illegal",
  "scam", "misleading", "privacy", "self_harm", "child_safety",
  "manipulation", "other",
])

const VALID_NOTICE_TYPES = new Set<NoticeType>([
  "content_labeled", "content_interstitial", "content_distribution_limited",
  "content_removed", "account_feature_limited", "account_suspended",
  "account_banned", "appeal_outcome",
])

const VALID_ACTION_TYPES = new Set([
  "remove", "label", "restrict_distribution", "warn",
])

const VALID_SEVERITIES = new Set(["LOW", "MED", "HIGH", "CRITICAL"])
const VALID_DETECTION_SOURCES = new Set([
  "user_report", "moderator", "automated", "trusted_reporter",
])

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function moderationRoutes(app: FastifyInstance) {

  // ── GET /api/moderation/notices ─────────────────────────────────────────────
  // Returns the caller's notices, newest first, 20 per page.
  // Sets delivered_at = NOW() on any undelivered notices returned.
  app.get("/api/moderation/notices", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user
    const { offset: rawOffset } = request.query as { offset?: string }
    const offset = Math.max(0, parseInt(rawOffset ?? "0", 10) || 0)

    // Fetch notices for this user
    const { rows } = await app.db.query<NoticeRow>(
      `SELECT id, action_id, notice_type, policy_section, primary_reason_code,
              plain_summary, affected_content_id, affected_excerpt, action_taken,
              action_start, action_end, can_repost, repost_instructions,
              appeal_deadline, appeal_id, read_at, created_at, delivered_at
       FROM moderation_notices
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20 OFFSET $2`,
      [userId, offset],
    )

    // Count total
    const countResult = await app.db.query<CountRow>(
      `SELECT COUNT(*)::text AS total FROM moderation_notices WHERE user_id = $1`,
      [userId],
    )
    const total = parseInt(countResult.rows[0]?.total ?? "0", 10)

    // Mark undelivered notices as delivered
    const undeliveredIds = rows
      .filter((n) => n.delivered_at === null)
      .map((n) => n.id)

    if (undeliveredIds.length > 0) {
      await app.db.query(
        `UPDATE moderation_notices
         SET delivered_at = NOW()
         WHERE id = ANY($1::uuid[])`,
        [undeliveredIds],
      )
    }

    // Strip internal field before returning
    const notices: Notice[] = rows.map(({ delivered_at: _d, ...n }) => n)

    return reply.send({ notices, total })
  })

  // ── GET /api/moderation/notices/:id ─────────────────────────────────────────
  // Returns a single notice belonging to the caller. Sets read_at on first read.
  app.get("/api/moderation/notices/:id", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    const { rows } = await app.db.query<NoticeRow>(
      `SELECT id, action_id, notice_type, policy_section, primary_reason_code,
              plain_summary, affected_content_id, affected_excerpt, action_taken,
              action_start, action_end, can_repost, repost_instructions,
              appeal_deadline, appeal_id, read_at, created_at, delivered_at
       FROM moderation_notices
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId],
    )

    if (rows.length === 0) {
      return reply.notFound("Notice not found")
    }

    const notice = rows[0]

    // Mark delivered if not yet
    if (notice.delivered_at === null) {
      await app.db.query(
        `UPDATE moderation_notices SET delivered_at = NOW() WHERE id = $1`,
        [id],
      )
    }

    // Mark read on first read
    if (notice.read_at === null) {
      await app.db.query(
        `UPDATE moderation_notices SET read_at = NOW() WHERE id = $1`,
        [id],
      )
      notice.read_at = new Date().toISOString()
    }

    const { delivered_at: _d, ...result } = notice
    return reply.send(result)
  })

  // ── POST /api/moderation/reports ────────────────────────────────────────────
  // Submit a user report for content or a user.
  app.post("/api/moderation/reports", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user
    const {
      content_id,
      reported_user_id,
      reason,
      detail,
    } = request.body as {
      content_id?:       unknown
      reported_user_id?: unknown
      reason:            unknown
      detail?:           unknown
    }

    if (typeof reason !== "string" || !VALID_REASONS.has(reason)) {
      return reply.badRequest(
        `reason must be one of: ${[...VALID_REASONS].join(", ")}`,
      )
    }

    if (
      content_id !== undefined &&
      (typeof content_id !== "string" || content_id.trim().length === 0)
    ) {
      return reply.badRequest("content_id must be a non-empty string if provided")
    }

    if (
      reported_user_id !== undefined &&
      (typeof reported_user_id !== "string" || reported_user_id.trim().length === 0)
    ) {
      return reply.badRequest("reported_user_id must be a non-empty string if provided")
    }

    if (detail !== undefined && typeof detail !== "string") {
      return reply.badRequest("detail must be a string if provided")
    }

    if (!content_id && !reported_user_id) {
      return reply.badRequest("At least one of content_id or reported_user_id is required")
    }

    const { rows } = await app.db.query<{ id: string }>(
      `INSERT INTO user_reports (reporter_id, content_id, reported_user_id, reason, detail)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        userId,
        content_id     ?? null,
        reported_user_id ?? null,
        reason,
        (detail as string | undefined) ?? null,
      ],
    )

    return reply.code(201).send({ report_id: rows[0].id })
  })

  // ── POST /api/moderation/appeals ────────────────────────────────────────────
  // Submit an appeal for a notice belonging to the caller.
  app.post("/api/moderation/appeals", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user
    const { notice_id, statement } = request.body as {
      notice_id: unknown
      statement?: unknown
    }

    if (typeof notice_id !== "string" || notice_id.trim().length === 0) {
      return reply.badRequest("notice_id is required")
    }

    if (statement !== undefined && typeof statement !== "string") {
      return reply.badRequest("statement must be a string if provided")
    }

    // Fetch the notice, ensuring it belongs to the caller
    const { rows: noticeRows } = await app.db.query<{
      id:             string
      action_id:      string
      appeal_deadline: string | null
      appeal_id:      string | null
    }>(
      `SELECT id, action_id, appeal_deadline, appeal_id
       FROM moderation_notices
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [notice_id, userId],
    )

    if (noticeRows.length === 0) {
      return reply.notFound("Notice not found")
    }

    const notice = noticeRows[0]

    // Check for duplicate appeal
    if (notice.appeal_id !== null) {
      return reply.conflict("An appeal has already been submitted for this notice")
    }

    // Check appeal deadline
    if (notice.appeal_deadline !== null && new Date(notice.appeal_deadline) < new Date()) {
      return reply.forbidden("The appeal deadline for this notice has passed")
    }

    // Create appeal
    const { rows: appealRows } = await app.db.query<{ id: string }>(
      `INSERT INTO moderation_appeals (action_id, user_id, resolution_note)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [notice.action_id, userId, (statement as string | undefined) ?? null],
    )

    const appealId = appealRows[0].id

    // Link appeal back to notice
    await app.db.query(
      `UPDATE moderation_notices SET appeal_id = $1 WHERE id = $2`,
      [appealId, notice_id],
    )

    return reply.code(201).send({ appeal_id: appealId })
  })

  // ── GET /api/moderation/appeals/:id ─────────────────────────────────────────
  // Returns the status of an appeal belonging to the caller.
  app.get("/api/moderation/appeals/:id", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    const { rows } = await app.db.query<AppealRow>(
      `SELECT id, status, submitted_at, resolution_note
       FROM moderation_appeals
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId],
    )

    if (rows.length === 0) {
      return reply.notFound("Appeal not found")
    }

    const { id: appealId, status, submitted_at, resolution_note } = rows[0]
    return reply.send({
      id:           appealId,
      status,
      submitted_at,
      outcome_note: resolution_note,
    })
  })

  // ── POST /api/moderation/actions  [INTERNAL — admin only] ───────────────────
  // Creates a moderation_actions row + moderation_notices row in a transaction.
  // Requires the caller to have role 'admin' in their JWT.
  app.post("/api/moderation/actions", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId: callerId, role } = request.user

    if (role !== "admin") {
      return reply.forbidden("Admin access required")
    }

    const {
      user_id,
      content_id,
      action_type,
      label,
      reason,
      policy_section,
      primary_reason_code,
      secondary_reason_codes,
      severity,
      detection_source,
      confidence,
      evidence_refs,
      notice,
    } = request.body as {
      user_id:               unknown
      content_id?:           unknown
      action_type:           unknown
      label?:                unknown
      reason:                unknown
      policy_section:        unknown
      primary_reason_code:   unknown
      secondary_reason_codes?: unknown
      severity:              unknown
      detection_source:      unknown
      confidence?:           unknown
      evidence_refs?:        unknown
      notice: {
        notice_type:         unknown
        plain_summary:       unknown
        action_taken:        unknown
        affected_excerpt?:   unknown
        can_repost?:         unknown
        repost_instructions?: unknown
      }
    }

    // ── Validate required top-level fields ───────────────────────────────────

    if (typeof user_id !== "string" || user_id.trim().length === 0) {
      return reply.badRequest("user_id is required")
    }
    if (typeof action_type !== "string" || !VALID_ACTION_TYPES.has(action_type)) {
      return reply.badRequest(
        `action_type must be one of: ${[...VALID_ACTION_TYPES].join(", ")}`,
      )
    }
    if (typeof reason !== "string" || reason.trim().length === 0) {
      return reply.badRequest("reason is required")
    }
    if (typeof policy_section !== "string" || policy_section.trim().length === 0) {
      return reply.badRequest("policy_section is required")
    }
    if (typeof primary_reason_code !== "string" || primary_reason_code.trim().length === 0) {
      return reply.badRequest("primary_reason_code is required")
    }
    if (typeof severity !== "string" || !VALID_SEVERITIES.has(severity)) {
      return reply.badRequest(
        `severity must be one of: ${[...VALID_SEVERITIES].join(", ")}`,
      )
    }
    if (typeof detection_source !== "string" || !VALID_DETECTION_SOURCES.has(detection_source)) {
      return reply.badRequest(
        `detection_source must be one of: ${[...VALID_DETECTION_SOURCES].join(", ")}`,
      )
    }

    // ── Validate notice sub-object ────────────────────────────────────────────

    if (!notice || typeof notice !== "object") {
      return reply.badRequest("notice object is required")
    }
    if (
      typeof notice.notice_type !== "string" ||
      !VALID_NOTICE_TYPES.has(notice.notice_type as NoticeType)
    ) {
      return reply.badRequest(
        `notice.notice_type must be one of: ${[...VALID_NOTICE_TYPES].join(", ")}`,
      )
    }
    if (typeof notice.plain_summary !== "string" || notice.plain_summary.trim().length === 0) {
      return reply.badRequest("notice.plain_summary is required")
    }
    if (typeof notice.action_taken !== "string" || notice.action_taken.trim().length === 0) {
      return reply.badRequest("notice.action_taken is required")
    }

    // ── Execute in a transaction ─────────────────────────────────────────────

    const client = await app.db.connect()
    try {
      await client.query("BEGIN")

      // Insert moderation action
      const { rows: actionRows } = await client.query<{ id: string }>(
        `INSERT INTO moderation_actions
           (content_id, user_id, action_type, label, reason, policy_section,
            primary_reason_code, secondary_reason_codes, severity, detection_source,
            confidence, evidence_refs, target_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          (content_id as string | undefined) ?? null,
          user_id,
          action_type,
          (label as string | undefined) ?? null,
          reason,
          policy_section,
          primary_reason_code,
          (secondary_reason_codes as string[] | undefined) ?? null,
          severity,
          detection_source,
          (confidence as number | undefined) ?? null,
          evidence_refs !== undefined ? JSON.stringify(evidence_refs) : null,
          user_id, // target_user_id = the user being actioned
        ],
      )

      const actionId = actionRows[0].id

      // Insert moderation notice with 30-day appeal deadline
      const { rows: noticeRows } = await client.query<{ id: string }>(
        `INSERT INTO moderation_notices
           (action_id, user_id, notice_type, policy_section, primary_reason_code,
            plain_summary, affected_content_id, affected_excerpt, action_taken,
            can_repost, repost_instructions, appeal_deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                 NOW() + INTERVAL '30 days')
         RETURNING id`,
        [
          actionId,
          user_id,
          notice.notice_type,
          policy_section,
          primary_reason_code,
          notice.plain_summary,
          (content_id as string | undefined) ?? null,
          (notice.affected_excerpt as string | undefined) ?? null,
          notice.action_taken,
          (notice.can_repost as boolean | undefined) ?? false,
          (notice.repost_instructions as string | undefined) ?? null,
        ],
      )

      const noticeId = noticeRows[0].id

      await client.query("COMMIT")

      return reply.code(201).send({ action_id: actionId, notice_id: noticeId })
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  })
}
