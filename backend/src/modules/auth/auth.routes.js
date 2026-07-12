// src/modules/auth/auth.routes.js

import { AuthController } from './auth.controller.js';

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  sessionsSchema,
  revokeSessionSchema,
  revokeAllSessionsSchema,
} from './auth.schema.js';

import { authenticate } from '../../middlewares/auth.middleware.js';

export default async function authRoutes(fastify) {
  const controller = new AuthController(fastify);

  /**
   * Register
   */
  fastify.post(
    '/register',
    {
      schema: registerSchema,
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 hour',
        },
      },
    },
    controller.register
  );

  /**
   * Login
   */
  fastify.post(
    '/login',
    {
      schema: loginSchema,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    controller.login
  );

  /**
   * Refresh tokens
   */
  fastify.post(
    '/refresh',
    {
      schema: refreshSchema,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 hour',
        },
      },
    },
    controller.refresh
  );

  /**
   * Logout current session
   */
  fastify.post(
    '/logout',
    {
      schema: logoutSchema,
      preHandler: [authenticate],
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 hour',
        },
      },
    },
    controller.logout
  );

  /**
   * List active device sessions
   */
  fastify.get(
    '/sessions',
    {
      schema: sessionsSchema,
      preHandler: [authenticate],
    },
    controller.getSessions
  );

  /**
   * Revoke one device session
   */
  fastify.delete(
    '/sessions/:sessionId',
    {
      schema: revokeSessionSchema,
      preHandler: [authenticate],
    },
    controller.revokeSession
  );

  /**
   * Revoke all device sessions
   */
  fastify.delete(
    '/sessions',
    {
      schema: revokeAllSessionsSchema,
      preHandler: [authenticate],
    },
    controller.revokeAllSessions
  );
}