// src/modules/messages/messages.controller.js

import { MessageService } from './messages.service.js';
import { successResponse } from '../../utils/response.js';

export class MessagesController {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.messageService = new MessageService(fastify);
  }

  /**
   * Send an encrypted message.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  send = async (request, reply) => {
    const message = await this.messageService.send(
      request.user.sub,
      request.body
    );

    return successResponse(
      reply,
      message,
      'Message sent successfully.',
      201
    );
  };

  /**
   * Retrieve conversation history.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  conversation = async (request, reply) => {
    const { userId } = request.params;
    const { page, limit } = request.query;

    const result =
      await this.messageService.conversation(
        request.user.sub,
        userId,
        page,
        limit
      );

    return successResponse(
      reply,
      result,
      'Conversation retrieved successfully.'
    );
  };

  /**
   * Mark a message as delivered.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  markDelivered = async (request, reply) => {
    const message =
      await this.messageService.markDelivered(
        request.params.messageId
      );

    return successResponse(
      reply,
      message,
      'Message marked as delivered.'
    );
  };

  /**
   * Mark a message as read.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  markRead = async (request, reply) => {
    const message =
      await this.messageService.markRead(
        request.params.messageId
      );

    return successResponse(
      reply,
      message,
      'Message marked as read.'
    );
  };
}