// src/modules/users/users.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { UsersController } from './users.controller.js';

import {
  getCurrentUserSchema,
  getUserByIdSchema,
  getUserByUsernameSchema,
  updateProfileSchema,
  changePasswordSchema,
  searchUsersSchema,
} from './users.schema.js';

export default async function usersRoutes(
  fastify
) {
  const controller =
    new UsersController(fastify);

  /**
   * Current authenticated user.
   */
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],

      schema: getCurrentUserSchema,
    },
    controller.getCurrentUser
  );

  /**
   * Search users.
   */
  fastify.get(
    '/search',
    {
      preHandler: [authenticate],

      schema: searchUsersSchema,
    },
    controller.searchUsers
  );

  /**
   * Get user by username.
   *
   * Must come before "/:id".
   */
  fastify.get(
    '/username/:username',
    {
      preHandler: [authenticate],

      schema: getUserByUsernameSchema,
    },
    controller.getUserByUsername
  );

  /**
   * Get user by ID.
   */
  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],

      schema: getUserByIdSchema,
    },
    controller.getUserById
  );

  /**
   * Update profile.
   */
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

  /**
   * Change password.
   */
  fastify.patch(
    '/change-password',
    {
      preHandler: [authenticate],

      schema: changePasswordSchema,

      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
    },
    controller.changePassword
  );
}