import { FastifyInstance } from 'fastify'

interface FeedPostRow {
  id:           string
  body:         string
  created_at:   Date
  author_id:    string
  handle:       string
  display_name: string
}

interface FeedCountRow {
  total: number
}

export default async function feedRoutes(app: FastifyInstance) {
  // GET /api/feed — following-only chronological feed (+ own posts)
  app.get("/api/feed", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user

    const query = request.query as Record<string, string | undefined>

    const rawLimit  = parseInt(query["limit"]  ?? "20", 10)
    const rawOffset = parseInt(query["offset"] ?? "0",  10)

    const limit  = Math.min(Math.max(isNaN(rawLimit)  ? 20 : rawLimit,  1), 50)
    const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0)

    const { rows: posts } = await app.db.query<FeedPostRow>(
      `SELECT c.id, c.body, c.created_at,
              u.id AS author_id, u.handle, u.display_name
       FROM content c
       JOIN users u ON u.id = c.author_id
       WHERE c.content_type = 'post'
         AND c.body IS NOT NULL
         AND (
           c.author_id = $1
           OR c.author_id IN (
             SELECT followee_id FROM follows WHERE follower_id = $1
           )
         )
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    )

    const { rows: countRows } = await app.db.query<FeedCountRow>(
      `SELECT COUNT(*)::int AS total
       FROM content c
       WHERE c.content_type = 'post'
         AND c.body IS NOT NULL
         AND (
           c.author_id = $1
           OR c.author_id IN (
             SELECT followee_id FROM follows WHERE follower_id = $1
           )
         )`,
      [userId],
    )

    const total = countRows[0]?.total ?? 0

    return reply.send({
      posts: posts.map((p) => ({
        id:         p.id,
        body:       p.body,
        created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
        author: {
          id:           p.author_id,
          handle:       p.handle,
          display_name: p.display_name,
        },
      })),
      total,
    })
  })
}
