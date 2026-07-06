// src/modules/auth/auth.routes.js

import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
} from './auth.schema.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

export default async function authRoutes(fastify) {
  const authService = new AuthService(fastify);

  // Register
  fastify.post(
    '/register',
    {
      schema: registerSchema,
    },
    async (request, reply) => {
      const result = await authService.register(request.body);

      return reply.code(201).send(result);
    }
  );

  // Login
  fastify.post(
    '/login',
    {
      schema: loginSchema,
    },
    async (request, reply) => {
      const result = await authService.login(request.body);

      return reply.code(200).send(result);
    }
  );

  fastify.post(
    '/logout',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const token = request.headers.authorization.replace(
        'Bearer ',
        ''
      );

      const result = await authService.logout(token);

      return reply.send(result);
    }
  );
}