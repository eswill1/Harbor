import { FastifyInstance } from 'fastify'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileCounts {
  follower_count:  string
  following_count: string
  post_count:      string
}

interface UserProfileRow {
  id:           string
  handle:       string
  display_name: string
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function userRoutes(app: FastifyInstance) {
  // GET /api/users/me — own profile
  // IMPORTANT: registered before /api/users/:id so the literal path wins
  app.get('/api/users/me', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user

    const userResult = await app.db.query<UserProfileRow>(
      'SELECT id, handle, display_name FROM users WHERE id = $1',
      [userId],
    )

    if (userResult.rows.length === 0) {
      return reply.notFound('User not found')
    }

    const user = userResult.rows[0]

    const countsResult = await app.db.query<ProfileCounts>(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE followee_id = $1) AS follower_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count,
         (SELECT COUNT(*) FROM content WHERE author_id = $1 AND content_type = 'post') AS post_count`,
      [userId],
    )

    const counts = countsResult.rows[0]

    return reply.send({
      id:             user.id,
      handle:         user.handle,
      display_name:   user.display_name,
      follower_count:  Number(counts.follower_count),
      following_count: Number(counts.following_count),
      post_count:      Number(counts.post_count),
    })
  })

  // GET /api/users/:id — another user's profile
  app.get('/api/users/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    const userResult = await app.db.query<UserProfileRow>(
      'SELECT id, handle, display_name FROM users WHERE id = $1',
      [id],
    )

    if (userResult.rows.length === 0) {
      return reply.notFound('User not found')
    }

    const user = userResult.rows[0]

    const countsResult = await app.db.query<ProfileCounts & { is_following: string }>(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE followee_id = $1) AS follower_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count,
         (SELECT COUNT(*) FROM content WHERE author_id = $1 AND content_type = 'post') AS post_count,
         EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = $1)::text AS is_following`,
      [id, userId],
    )

    const counts = countsResult.rows[0]

    return reply.send({
      id:              user.id,
      handle:          user.handle,
      display_name:    user.display_name,
      follower_count:  Number(counts.follower_count),
      following_count: Number(counts.following_count),
      post_count:      Number(counts.post_count),
      is_following:    counts.is_following === 'true',
    })
  })

  // POST /api/users/:id/follow — follow a user
  app.post('/api/users/:id/follow', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    if (id === userId) {
      return reply.badRequest('Cannot follow yourself')
    }

    await app.db.query(
      `INSERT INTO follows (follower_id, followee_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, id],
    )

    return reply.send({ ok: true })
  })

  // DELETE /api/users/:id/follow — unfollow a user
  app.delete('/api/users/:id/follow', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    await app.db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2',
      [userId, id],
    )

    return reply.send({ ok: true })
  })
}
