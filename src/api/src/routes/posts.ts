import { FastifyInstance } from 'fastify'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostRow {
  id:           string
  body:         string
  created_at:   Date
  author_id:    string
  handle:       string
  display_name: string
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function postRoutes(app: FastifyInstance) {
  // POST /api/posts — create a text post
  app.post('/api/posts', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const body = (request.body as Record<string, unknown>)

    const content = body?.content

    if (typeof content !== 'string' || content.trim().length === 0) {
      return reply.badRequest('content must be a non-empty string')
    }

    if (content.length > 500) {
      return reply.badRequest('content must be 500 characters or fewer')
    }

    const { userId } = request.user

    const { rows } = await app.db.query<PostRow>(
      `INSERT INTO content (author_id, content_type, body)
       VALUES ($1, 'post', $2)
       RETURNING
         id,
         body,
         created_at,
         author_id`,
      [userId, content],
    )

    const post = rows[0]

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

  // POST /api/posts/:id/share — log a share event (friction pipeline entry point)
  app.post('/api/posts/:id/share', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }   = request.params as { id: string }
    const body     = request.body as Record<string, unknown>
    const shareType = body?.share_type

    if (!['friend', 'group', 'copy_link'].includes(shareType as string)) {
      return reply.badRequest('share_type must be friend, group, or copy_link')
    }

    const { userId } = request.user

    // Verify the content exists
    const { rowCount } = await app.db.query(
      `SELECT 1 FROM content WHERE id = $1 AND content_type = 'post'`,
      [id],
    )
    if (!rowCount) return reply.notFound('Post not found')

    // Log as a user signal (share events feed into Phase 2 metrics)
    await app.db.query(
      `INSERT INTO user_signals (user_id, signal_type, content_id)
       VALUES ($1, $2, $3)`,
      [userId, `share_${shareType}`, id],
    )

    return { ok: true }
  })

  // GET /api/posts/feed — latest 50 posts, newest first, joined with users
  app.get('/api/posts/feed', {
    preHandler: [app.authenticate],
  }, async (_request, reply) => {
    const { rows } = await app.db.query<PostRow>(
      `SELECT c.id, c.body, c.created_at,
              u.id AS author_id, u.handle, u.display_name
       FROM content c
       JOIN users u ON u.id = c.author_id
       WHERE c.content_type = 'post'
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
    })))
  })
}
