// src/modules/keys/keys.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { KeysController } from './keys.controller.js';

import {
  uploadKeySchema,
  getKeySchema,
} from './keys.schema.js';

export default async function keysRoutes(fastify) {
  const controller = new KeysController(fastify);

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