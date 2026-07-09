// src/plugins/helmet.js

import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';

/**
 * Fastify Helmet plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function helmetPlugin(fastify) {
  await fastify.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },

    referrerPolicy: {
      policy: 'no-referrer',
    },
  });

  fastify.log.info('✅ Helmet initialized');
}

export default fp(helmetPlugin, {
  name: 'helmet',
});