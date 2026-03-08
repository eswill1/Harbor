import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance } from 'fastify'
import { config } from '../config'

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '15m' },
  })
})
