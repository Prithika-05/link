// src/modules/auth/auth.routes.js

import { AuthController } from './auth.controller.js';

import {
  registerSchema,
  loginSchema,
  logoutSchema,
} from './auth.schema.js';

import { authenticate } from '../../middlewares/auth.middleware.js';

export default async function authRoutes(fastify) {
  const controller = new AuthController(fastify);

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
}