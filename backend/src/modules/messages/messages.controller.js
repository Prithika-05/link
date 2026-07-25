// src/modules/messages/messages.controller.js

import { MessageService } from './messages.service.js';
import { successResponse } from '../../utils/response.js';

export class MessagesController {
  constructor(fastify) {
    this.messagesService = new MessageService(
      fastify
    );
  }

  send = async (request, reply) => {
    const message =
      await this.messagesService.send(
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

  conversation = async (
    request,
    reply
  ) => {
    const { userId } = request.params;

    const page = Number(
      request.query.page ?? 1
    );

    const limit = Number(
      request.query.limit ?? 50
    );

    const result =
      await this.messagesService.conversation(
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

  markDelivered = async (
    request,
    reply
  ) => {
    const message =
      await this.messagesService.markDelivered(
        request.params.messageId,
        request.user.sub
      );

    return successResponse(
      reply,
      message,
      'Message marked as delivered.'
    );
  };

  markRead = async (
    request,
    reply
  ) => {
    const message =
      await this.messagesService.markRead(
        request.params.messageId,
        request.user.sub
      );

    return successResponse(
      reply,
      message,
      'Message marked as read.'
    );
  };
}