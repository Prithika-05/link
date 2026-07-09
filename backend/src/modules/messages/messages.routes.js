// src/modules/messages/messages.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';
import { MessageService } from './messages.service.js';
import {
  sendMessageSchema,
  conversationSchema,
} from './messages.schema.js';

export default async function messageRoutes(fastify) {
  const messageService = new MessageService(fastify);

  fastify.post(
    '/',
    {
      preHandler: [authenticate],
        schema: sendMessageSchema,
        config: {
        rateLimit: {
          max: 120,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const result = await messageService.send(
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
      schema: conversationSchema,
    },
    async (request) => {
      return messageService.conversation(
        request.user.sub,
        request.params.userId
      );
    }
  );
}