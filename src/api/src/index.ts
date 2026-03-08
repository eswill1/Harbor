import { setDefaultResultOrder } from 'node:dns'
setDefaultResultOrder('ipv4first')

import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

import { config } from './config'
import dbPlugin from './plugins/db'
import jwtPlugin from './plugins/jwt'
import cookiePlugin from './plugins/cookie'
import authenticatePlugin from './plugins/authenticate'
import sensiblePlugin from './plugins/sensible'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import deckRoutes from './routes/decks'
import postRoutes from './routes/posts'
import userRoutes from './routes/users'
import shelvesRoutes from './routes/shelves'

const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
})

const start = async () => {
  // Plugins
  await app.register(cors, { origin: config.CORS_ORIGIN })
  await app.register(helmet)
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(dbPlugin)
  await app.register(jwtPlugin)
  await app.register(cookiePlugin)
  await app.register(authenticatePlugin)
  await app.register(sensiblePlugin)

  // Routes
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(deckRoutes)
  await app.register(postRoutes)
  await app.register(userRoutes)
  await app.register(shelvesRoutes)

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
