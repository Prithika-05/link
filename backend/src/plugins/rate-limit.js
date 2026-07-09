// src/plugins/rate-limit.js

/**
 * ---------------------------------------------------------
 * Rate Limit Plugin
 * ---------------------------------------------------------
 * Registers Fastify Rate Limit.
 *
 * Global rate limiting is disabled.
 * Individual routes configure their own limits based on
 * their security requirements.
 *
 * Examples:
 *
 * Login
 * Register
 * Public Key Upload
 * Send Message
 *
 * ---------------------------------------------------------
 */

import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';

/**
 * Fastify Rate Limit plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function rateLimitPlugin(fastify) {
  await fastify.register(fastifyRateLimit, {

    global: false,
    max: 100,
    timeWindow: '1 minute',

    allowList() {
      return false;
    },

    errorResponseBuilder(request, context) {
      return {
        success: false,

        error: {
          code: 'RATE_LIMIT_EXCEEDED',

          message:
            'Too many requests. Please try again later.',
        },

        retryAfter: context.after,
      };
    },
  });

  fastify.log.info('Rate Limiter initialized');
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});