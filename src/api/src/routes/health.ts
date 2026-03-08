import { FastifyInstance } from 'fastify'

export default async (app: FastifyInstance) => {
  app.get('/health', async (request, reply) => {
    let dbOk = false
    try {
      await app.db.query('SELECT 1')
      dbOk = true
    } catch {
      dbOk = false
    }

    const status = dbOk ? 'ok' : 'degraded'
    reply.code(dbOk ? 200 : 503)

    return {
      status,
      service:   'harbor-api',
      version:   '0.1.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'ok' : 'unreachable',
      },
    }
  })
}
