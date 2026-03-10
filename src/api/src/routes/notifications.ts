import { FastifyInstance } from 'fastify'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationRow {
  id:           string
  type:         'follow' | 'shelf_save'
  actor_id:     string
  actor_handle:       string
  actor_display_name: string
  content_id:   string | null
  content_body: string | null
  read_at:      Date | null
  created_at:   Date
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function notificationRoutes(app: FastifyInstance) {

  // ── GET /api/notifications — list for current user ─────────────────────────

  app.get('/api/notifications', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user

    const { rows } = await app.db.query<NotificationRow>(
      `SELECT n.id, n.type, n.actor_id, n.content_id, n.read_at, n.created_at,
              a.handle           AS actor_handle,
              a.display_name     AS actor_display_name,
              substring(c.body, 1, 120) AS content_body
       FROM notifications n
       JOIN users a ON a.id = n.actor_id
       LEFT JOIN content c ON c.id = n.content_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId],
    )

    return reply.send(rows.map(r => ({
      id:         r.id,
      type:       r.type,
      actor: {
        id:           r.actor_id,
        handle:       r.actor_handle,
        display_name: r.actor_display_name,
      },
      content_id:   r.content_id,
      content_body: r.content_body,
      read_at:      r.read_at,
      created_at:   r.created_at,
    })))
  })

  // ── POST /api/notifications/read — mark all unread as read ─────────────────

  app.post('/api/notifications/read', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user

    await app.db.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    )

    return reply.send({ ok: true })
  })
}
