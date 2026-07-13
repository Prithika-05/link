// src/modules/messages/messages.routes.js

import { authenticate } from '../../middlewares/auth.middleware.js';

import { MessagesController } from './messages.controller.js';

import {
  sendMessageSchema,
  conversationSchema,
  markDeliveredSchema,
  markReadSchema,
} from './messages.schema.js';

export default async function messagesRoutes(
  fastify
) {
  const controller =
    new MessagesController(fastify);

  /**
   * Send an encrypted message.
   */
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

  /**
   * Retrieve conversation history.
   */
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

  /**
   * Mark a message as delivered.
   */
  fastify.patch(
    '/:messageId/delivered',
    {
      preHandler: [authenticate],

      schema: markDeliveredSchema,

      config: {
        rateLimit: {
          max: 120,
          timeWindow: '1 minute',
        },
      },
    },
    controller.markDelivered
  );

  /**
   * Mark a message as read.
   */
  fastify.patch(
    '/:messageId/read',
    {
      preHandler: [authenticate],

      schema: markReadSchema,

      config: {
        rateLimit: {
          max: 120,
          timeWindow: '1 minute',
        },
      },
    },
    controller.markRead
  );
}