// src/modules/keys/keys.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';
import { KeysService } from './keys.service.js';
import {
  uploadKeySchema,
  getKeySchema,
} from './keys.schema.js';

export default async function keysRoutes(fastify) {
  const keysService = new KeysService(fastify);

  fastify.post(
    '/',
    {
      preHandler: [authenticate],
        schema: uploadKeySchema,
        config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
        },
      },
    }, 
    async (request, reply) => {
      const result = await keysService.upload(
        request.user.sub,
        request.body
      );

      return reply.code(201).send(result);
    }
  );

  fastify.get(
    '/:userId',
    {
      preHandler: [authenticate],
      schema: getKeySchema,
    },
    async (request) => {
      return keysService.get(request.params.userId);
    }
  );
}