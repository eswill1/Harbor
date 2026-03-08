import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import { FastifyInstance } from 'fastify'

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyCookie)
})
