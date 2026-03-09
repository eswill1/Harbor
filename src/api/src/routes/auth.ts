import { createHash, randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { config } from '../config'

const BCRYPT_ROUNDS    = 12
const REFRESH_TTL_MS   = 30 * 24 * 60 * 60 * 1000 // 30 days
const REFRESH_COOKIE   = 'refresh_token'

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

const setRefreshCookie = (
  app: FastifyInstance,
  reply: Parameters<FastifyInstance['authenticate']>[1],
  token: string,
  expires: Date,
) => {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure:   config.isProduction,
    sameSite: 'strict',
    path:     '/auth',
    expires,
  })
}

const issueTokenPair = async (
  app: FastifyInstance,
  reply: Parameters<FastifyInstance['authenticate']>[1],
  userId: string,
  role: 'user' | 'admin' = 'user',
) => {
  const accessToken  = app.jwt.sign({ userId, role })
  const refreshToken = randomUUID()
  const expires      = new Date(Date.now() + REFRESH_TTL_MS)

  await app.db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(refreshToken), expires],
  )

  setRefreshCookie(app, reply, refreshToken, expires)

  return { access_token: accessToken, refresh_token: refreshToken }
}

// ─── Route schemas ─────────────────────────────────────────────────────────

const registerSchema = {
  body: {
    type: 'object',
    required: ['handle', 'display_name', 'email', 'password'],
    properties: {
      handle:       { type: 'string', minLength: 3,  maxLength: 30  },
      display_name: { type: 'string', minLength: 1,  maxLength: 50  },
      email:        { type: 'string', format: 'email'               },
      password:     { type: 'string', minLength: 8,  maxLength: 128 },
    },
    additionalProperties: false,
  },
} as const

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string'                  },
    },
    additionalProperties: false,
  },
} as const

// ─── Routes ───────────────────────────────────────────────────────────────

export default async (app: FastifyInstance) => {
  // POST /auth/register
  app.post('/auth/register', { schema: registerSchema }, async (request, reply) => {
    const { handle, display_name, email, password } = request.body as {
      handle: string
      display_name: string
      email: string
      password: string
    }

    // Check uniqueness
    const existing = await app.db.query(
      'SELECT id FROM users WHERE handle = $1 OR email = $2 LIMIT 1',
      [handle, email],
    )
    if (existing.rowCount && existing.rowCount > 0) {
      return reply.conflict('Handle or email already in use')
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const { rows } = await app.db.query<{ id: string }>(
      `INSERT INTO users (handle, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [handle, display_name, email, password_hash],
    )

    const userId = rows[0].id
    const tokens = await issueTokenPair(app, reply, userId)

    reply.code(201)
    return {
      ...tokens,
      user: { id: userId, handle, display_name },
    }
  })

  // POST /auth/login
  app.post('/auth/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body as {
      email: string
      password: string
    }

    const { rows } = await app.db.query<{
      id: string
      handle: string
      display_name: string
      password_hash: string
      role: 'user' | 'admin'
    }>(
      'SELECT id, handle, display_name, password_hash, role FROM users WHERE email = $1',
      [email],
    )

    const user = rows[0]
    // Constant-time comparison even when user not found
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, '$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')

    if (!user || !valid) {
      return reply.unauthorized('Invalid email or password')
    }

    const tokens = await issueTokenPair(app, reply, user.id, user.role)

    return {
      ...tokens,
      user: { id: user.id, handle: user.handle, display_name: user.display_name },
    }
  })

  // POST /auth/refresh
  // Accepts refresh token from httpOnly cookie (web) or request body (mobile)
  app.post('/auth/refresh', async (request, reply) => {
    const token =
      request.cookies?.[REFRESH_COOKIE] ||
      (request.body as Record<string, unknown>)?.[REFRESH_COOKIE] as string | undefined

    if (!token) {
      return reply.unauthorized('Missing refresh token')
    }

    const tokenHash = hashToken(token)

    const { rows } = await app.db.query<{
      id: string
      user_id: string
      expires_at: Date
      revoked_at: Date | null
    }>(
      `SELECT id, user_id, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash],
    )

    const stored = rows[0]

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      return reply.unauthorized('Refresh token invalid or expired')
    }

    // Rotate — revoke old, issue new
    await app.db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [stored.id],
    )

    const { rows: userRows } = await app.db.query<{ role: 'user' | 'admin' }>(
      'SELECT role FROM users WHERE id = $1',
      [stored.user_id],
    )

    const tokens = await issueTokenPair(app, reply, stored.user_id, userRows[0]?.role ?? 'user')
    return tokens
  })

  // POST /auth/logout
  app.post(
    '/auth/logout',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const token =
        request.cookies?.[REFRESH_COOKIE] ||
        (request.body as Record<string, unknown>)?.[REFRESH_COOKIE] as string | undefined

      if (token) {
        await app.db.query(
          'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
          [hashToken(token)],
        )
      }

      reply.clearCookie(REFRESH_COOKIE, { path: '/auth' })
      return { success: true }
    },
  )
}
