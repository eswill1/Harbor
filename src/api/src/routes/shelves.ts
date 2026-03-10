import { FastifyInstance } from "fastify"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShelfRow {
  id:         string
  name:       string
  created_at: Date
  item_count: number
}

interface ShelfExistsRow {
  id:      string
  user_id: string
}

interface SavedItemRow {
  id:              string
  content_id:      string
  saved_at:        Date
  body:            string | null
  post_created_at: Date
  author_id:       string
  handle:          string
  display_name:    string
}

interface ContentExistsRow {
  id: string
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function shelvesRoutes(app: FastifyInstance) {
  // GET /api/shelves — list current user's shelves
  app.get("/api/shelves", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user

    const { rows } = await app.db.query<ShelfRow>(
      `SELECT s.id, s.name, s.created_at, COUNT(si.id)::int AS item_count
       FROM shelves s
       LEFT JOIN saved_items si ON si.shelf_id = s.id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [userId],
    )

    return reply.send(rows)
  })

  // POST /api/shelves — create a shelf
  app.post("/api/shelves", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user
    const { name }   = request.body as { name: unknown }

    if (typeof name !== "string" || name.trim().length === 0) {
      return reply.badRequest("name is required")
    }
    if (name.trim().length > 50) {
      return reply.badRequest("name must be 50 characters or fewer")
    }

    const trimmedName = name.trim()

    // Check for duplicate shelf name for this user
    const dupCheck = await app.db.query<{ id: string }>(
      "SELECT id FROM shelves WHERE user_id = $1 AND name = $2 LIMIT 1",
      [userId, trimmedName],
    )
    if (dupCheck.rows.length > 0) {
      return reply.conflict("A shelf with that name already exists")
    }

    const { rows } = await app.db.query<{ id: string; name: string; created_at: Date }>(
      `INSERT INTO shelves (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [userId, trimmedName],
    )

    return reply.code(201).send({ ...rows[0], item_count: 0 })
  })

  // DELETE /api/shelves/:id — delete a shelf
  app.delete("/api/shelves/:id", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    const shelf = await app.db.query<ShelfExistsRow>(
      "SELECT id, user_id FROM shelves WHERE id = $1 LIMIT 1",
      [id],
    )

    if (shelf.rows.length === 0) {
      return reply.notFound("Shelf not found")
    }
    if (shelf.rows[0].user_id !== userId) {
      return reply.forbidden("You do not own this shelf")
    }

    await app.db.query("DELETE FROM shelves WHERE id = $1", [id])

    return reply.send({ ok: true })
  })

  // GET /api/shelves/:id/items — list items in a shelf
  app.get("/api/shelves/:id/items", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }     = request.params as { id: string }
    const { userId } = request.user

    const shelf = await app.db.query<ShelfExistsRow>(
      "SELECT id, user_id FROM shelves WHERE id = $1 LIMIT 1",
      [id],
    )

    if (shelf.rows.length === 0) {
      return reply.notFound("Shelf not found")
    }
    if (shelf.rows[0].user_id !== userId) {
      return reply.forbidden("You do not own this shelf")
    }

    const { rows } = await app.db.query<SavedItemRow>(
      `SELECT si.id, si.content_id, si.saved_at,
              c.body, c.created_at AS post_created_at,
              u.id AS author_id, u.handle, u.display_name
       FROM saved_items si
       JOIN content c ON c.id = si.content_id
       JOIN users u ON u.id = c.author_id
       WHERE si.shelf_id = $1
       ORDER BY si.saved_at DESC`,
      [id],
    )

    const items = rows.map((row) => ({
      id:         row.id,
      content_id: row.content_id,
      saved_at:   row.saved_at,
      post: {
        id:         row.content_id,
        body:       row.body,
        created_at: row.post_created_at,
        author: {
          id:           row.author_id,
          handle:       row.handle,
          display_name: row.display_name,
        },
      },
    }))

    return reply.send(items)
  })

  // POST /api/shelves/:id/items — save a post to a shelf
  app.post("/api/shelves/:id/items", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }         = request.params as { id: string }
    const { userId }     = request.user
    const { content_id } = request.body as { content_id: unknown }

    if (typeof content_id !== "string" || content_id.trim().length === 0) {
      return reply.badRequest("content_id is required")
    }

    const shelf = await app.db.query<ShelfExistsRow>(
      "SELECT id, user_id FROM shelves WHERE id = $1 LIMIT 1",
      [id],
    )

    if (shelf.rows.length === 0) {
      return reply.notFound("Shelf not found")
    }
    if (shelf.rows[0].user_id !== userId) {
      return reply.forbidden("You do not own this shelf")
    }

    const contentCheck = await app.db.query<ContentExistsRow>(
      "SELECT id FROM content WHERE id = $1 LIMIT 1",
      [content_id],
    )
    if (contentCheck.rows.length === 0) {
      return reply.notFound("Content not found")
    }

    const { rowCount } = await app.db.query(
      `INSERT INTO saved_items (user_id, shelf_id, content_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [userId, id, content_id],
    )

    // Notify the content author (skip if saving own content or duplicate save)
    if (rowCount && rowCount > 0) {
      const authorResult = await app.db.query<{ author_id: string }>(
        'SELECT author_id FROM content WHERE id = $1',
        [content_id],
      )
      const authorId = authorResult.rows[0]?.author_id
      if (authorId && authorId !== userId) {
        await app.db.query(
          `INSERT INTO notifications (user_id, type, actor_id, content_id)
           VALUES ($1, 'shelf_save', $2, $3)
           ON CONFLICT (user_id, actor_id, content_id) WHERE type = 'shelf_save'
           DO UPDATE SET created_at = NOW(), read_at = NULL`,
          [authorId, userId, content_id],
        ).catch(() => {})
      }
    }

    return reply.send({ ok: true })
  })

  // DELETE /api/shelves/:id/items/:contentId — remove a saved item
  app.delete("/api/shelves/:id/items/:contentId", {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id, contentId } = request.params as { id: string; contentId: string }
    const { userId }        = request.user

    const shelf = await app.db.query<ShelfExistsRow>(
      "SELECT id, user_id FROM shelves WHERE id = $1 LIMIT 1",
      [id],
    )

    if (shelf.rows.length === 0) {
      return reply.notFound("Shelf not found")
    }
    if (shelf.rows[0].user_id !== userId) {
      return reply.forbidden("You do not own this shelf")
    }

    await app.db.query(
      "DELETE FROM saved_items WHERE shelf_id = $1 AND content_id = $2 AND user_id = $3",
      [id, contentId, userId],
    )

    return reply.send({ ok: true })
  })
}
