// src/modules/messages/messages.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { MessagesController } from './messages.controller.js';

import {
  sendMessageSchema,
  conversationSchema,
  markDeliveredSchema,
  markReadSchema,
} from './messages.schema.js';

export default async function messagesRoutes(fastify) {
  const controller = new MessagesController(fastify);

  fastify.post(
    '/',
    {
      preHandler: [authenticate],

      schema: sendMessageSchema,

      config: {
        rateLimit: {
          max: 120,
          timeWindow: '1 minute',
        },
      },
    },
    controller.send
  );

  fastify.get(
    '/:userId',
    {
      preHandler: [authenticate],

      schema: conversationSchema,

      config: {
        rateLimit: {
          max: 300,
          timeWindow: '1 minute',
        },
      },
    },
    controller.conversation
  );

  fastify.patch(
    '/:messageId/delivered',
    {
      preHandler: [authenticate],

      schema: markDeliveredSchema,
    },
    controller.markDelivered
  );

  fastify.patch(
    '/:messageId/read',
    {
      preHandler: [authenticate],

      schema: markReadSchema,
    },
    controller.markRead
  );
}