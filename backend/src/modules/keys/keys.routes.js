// src/modules/keys/keys.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { KeysController } from './keys.controller.js';

import {
  uploadKeySchema,
  getKeySchema,
  listKeysSchema,
  deleteKeySchema,
} from './keys.schema.js';

export default async function keysRoutes(
  fastify
) {
  const controller =
    new KeysController(fastify);

  /**
   * Upload or update the authenticated user's
   * public key.
   */
  fastify.post(
    '/',
    {
      preHandler: [authenticate],

      schema: uploadKeySchema,

      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    controller.upload
  );

  /**
   * List the authenticated user's keys.
   *
   * Must come before "/:userId".
   */
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],

      schema: listKeysSchema,

      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
    },
    controller.list
  );

  /**
   * Delete the authenticated user's key.
   *
   * Must come before "/:userId".
   */
  fastify.delete(
    '/me',
    {
      preHandler: [authenticate],

      schema: deleteKeySchema,

      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    controller.delete
  );

  /**
   * Retrieve another user's public key.
   */
  fastify.get(
    '/:userId',
    {
      preHandler: [authenticate],

      schema: getKeySchema,

      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
    },
    controller.get
  );
}