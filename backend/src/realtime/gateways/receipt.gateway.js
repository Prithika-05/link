// src/realtime/gateways/receipt.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import { MessageService } from '../../modules/messages/messages.service.js';

export function registerReceiptHandlers(
  socket,
  io,
  fastify
) {
  const messageService = new MessageService(fastify);

  socket.on(
    EVENTS.MESSAGE_DELIVERED,
    async ({ messageId }, callback) => {
      try {
        const message =
          await messageService.markDelivered(
            messageId
          );

        connectionManager.emit(
          message.senderId,
          EVENTS.MESSAGE_DELIVERED,
          {
            messageId,
            status: message.status,
          }
        );

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
        fastify.log.error(error);

        if (typeof callback === 'function') {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );

  socket.on(
    EVENTS.MESSAGE_READ,
    async ({ messageId }, callback) => {
      try {
        const message =
          await messageService.markRead(
            messageId
          );

        connectionManager.emit(
          message.senderId,
          EVENTS.MESSAGE_READ,
          {
            messageId,
            status: message.status,
          }
        );

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
        fastify.log.error(error);

        if (typeof callback === 'function') {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );
}