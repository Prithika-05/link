// src/plugins/redis.js

import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';

import { env } from '../config/env.js';

/**
 * Fastify Redis plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function redisPlugin(fastify) {
  try {
    await fastify.register(fastifyRedis, {
      url: env.redisUrl,

      closeClient: true,
    });

    fastify.log.info('Connected to Redis');
  } catch (error) {
    fastify.log.fatal(error);

    throw error;
  }
}

export default fp(redisPlugin, {
  name: 'redis',
});