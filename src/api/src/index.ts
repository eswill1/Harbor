import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
})

const start = async () => {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  })

  await app.register(helmet)

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  app.get('/health', async () => ({
    status: 'ok',
    service: 'harbor-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }))

  app.get('/api/v1/ping', async () => ({ pong: true }))

  try {
    await app.listen({
      port: Number(process.env.PORT ?? 4000),
      host: '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
