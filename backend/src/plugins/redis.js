// src/plugins/redis.js

import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { env } from '../config/env.js';

async function redisPlugin(fastify) {
  await fastify.register(fastifyRedis, {
    url: env.redisUrl,
    closeClient: true,
  });

  fastify.log.info('✅ Connected to Redis');
}

export default fp(redisPlugin, {
  name: 'redis',
});