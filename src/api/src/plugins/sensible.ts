import fp from 'fastify-plugin'
import sensible from '@fastify/sensible'
import { FastifyInstance } from 'fastify'

export default fp(async (app: FastifyInstance) => {
  app.register(sensible)
})
