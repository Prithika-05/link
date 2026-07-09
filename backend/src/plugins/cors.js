// src/plugins/cors.js

import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

import { env } from '../config/env.js';

/**
 * Fastify CORS plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function corsPlugin(fastify) {
  const allowedOrigins =
    env.nodeEnv === 'production'
      ? env.corsOrigins
      : true;

  await fastify.register(fastifyCors, {
    origin: allowedOrigins,

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    exposedHeaders: [
      'Authorization',
    ],

    maxAge: 86400,
  });

  fastify.log.info('✅ CORS initialized');
}

export default fp(corsPlugin, {
  name: 'cors',
});