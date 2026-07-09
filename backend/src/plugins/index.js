// src/plugins/index.js

import corsPlugin from './cors.js';
import helmetPlugin from './helmet.js';

import prismaPlugin from './prisma.js';

import jwtPlugin from './jwt.js';

import redisPlugin from './redis.js';

import rateLimitPlugin from './rate-limit.js';

const plugins = [

  corsPlugin,
  helmetPlugin,
  prismaPlugin,
  jwtPlugin,
  redisPlugin,
  rateLimitPlugin,
];

/**
 * Register every application plugin.
 *
 * @param {import('fastify').FastifyInstance} app
 */
export async function registerPlugins(app) {
  for (const plugin of plugins) {
    await app.register(plugin);
  }
}