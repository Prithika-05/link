// src/realtime/gateways/receipt.gateway.js

import { EVENTS } from '../events.js';
import { MessageService } from '../../modules/messages/messages.service.js';
import { connectionManager } from '../managers/connection.manager.js';

export function registerReceiptHandlers(socket, io, fastify) {
  const messageService = new MessageService(fastify);

  socket.on(
    EVENTS.MESSAGE_DELIVERED,
    async ({ messageId }) => {
      try {
        const message =
          await messageService.markDelivered(messageId);

        connectionManager.emit(
          message.senderId,
          EVENTS.MESSAGE_DELIVERED,
          {
            messageId,
          }
        );
      } catch (error) {
        fastify.log.error(error);
      }
    }
  );
}