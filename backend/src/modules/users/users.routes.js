// src/modules/users/users.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

export default async function userRoutes(fastify) {
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request) => {
      return {
        success: true,
        user: request.user,
      };
    }
  );
}