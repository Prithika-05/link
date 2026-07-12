// src/modules/users/users.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { UsersController } from './users.controller.js';

import {
  getCurrentUserSchema,
  getUserByIdSchema,
  updateProfileSchema,
  searchUsersSchema,
} from './users.schema.js';

export default async function usersRoutes(fastify) {
  const controller = new UsersController(fastify);


  fastify.get(
    '/me',
    {
      preHandler: [authenticate],

      schema: getCurrentUserSchema,
    },
    controller.getCurrentUser
  );


  fastify.get(
    '/search',
    {
      preHandler: [authenticate],

      schema: searchUsersSchema,
    },
    controller.searchUsers
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],

      schema: getUserByIdSchema,
    },
    controller.getUserById
  );

  fastify.patch(
    '/me',
    {
      preHandler: [authenticate],

      schema: updateProfileSchema,

      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 hour',
        },
      },
    },
    controller.updateProfile
  );
}