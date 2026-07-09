// src/plugins/rate-limit.js

import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';

async function rateLimitPlugin(fastify) {
  await fastify.register(fastifyRateLimit, {
    global: false,

    max: 100,

    timeWindow: '1 minute',

    allowList: (request) => {
      return false;
    },

    errorResponseBuilder(request, context) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: context.after,
      };
    },
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});