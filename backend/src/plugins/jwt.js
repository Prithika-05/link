// src/plugins/jwt.js

import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import { env } from '../config/env.js';

/**
 * Fastify JWT plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function jwtPlugin(fastify) {
  await fastify.register(fastifyJwt, {
    secret: env.jwtSecret,

    sign: {
      algorithm: 'HS256',

      issuer: 'secure-chat-backend',

      audience: 'secure-chat-client',

      expiresIn: '15m',
    },

    verify: {
      allowedIss: 'secure-chat-backend',

      allowedAud: 'secure-chat-client',
    },
  });

  fastify.log.info('JWT initialized');
}

export default fp(jwtPlugin, {
  name: 'jwt',
});