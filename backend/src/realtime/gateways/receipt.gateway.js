// src/realtime/gateways/receipt.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import { MessageService } from '../../modules/messages/messages.service.js';

export function registerReceiptHandlers(
  socket,
  io,
  fastify
) {
  const messageService =
    new MessageService(fastify);

  /**
   * Message delivered.
   */
  socket.on(
    EVENTS.MESSAGE_DELIVERED,
    async ({ messageId }, callback) => {
      try {
        if (!messageId) {
          throw new Error(
            'Message ID is required.'
          );
        }

        const message =
          await messageService.markDelivered(
            messageId
          );

        connectionManager.emit(
          message.senderId,
          EVENTS.MESSAGE_DELIVERED,
          {
            messageId: message.id,
            status: message.status,
            receiverId: message.receiverId,
          }
        );

        if (
          typeof callback === 'function'
        ) {
          callback({
            success: true,

            data: {
              messageId: message.id,
              status: message.status,
            },
          });
        }

        fastify.log.debug(
          {
            messageId: message.id,
            senderId: message.senderId,
            receiverId:
              message.receiverId,
          },
          'Message marked as delivered.'
        );
      } catch (error) {
        fastify.log.error(
          {
            error: error.message,
          },
          'Failed to mark message as delivered.'
        );

        if (
          typeof callback === 'function'
        ) {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );

  /**
   * Message read.
   */
  socket.on(
    EVENTS.MESSAGE_READ,
    async ({ messageId }, callback) => {
      try {
        if (!messageId) {
          throw new Error(
            'Message ID is required.'
          );
        }

        const message =
          await messageService.markRead(
            messageId
          );

        connectionManager.emit(
          message.senderId,
          EVENTS.MESSAGE_READ,
          {
            messageId: message.id,
            status: message.status,
            receiverId: message.receiverId,
          }
        );

        if (
          typeof callback === 'function'
        ) {
          callback({
            success: true,

            data: {
              messageId: message.id,
              status: message.status,
            },
          });
        }

        fastify.log.debug(
          {
            messageId: message.id,
            senderId: message.senderId,
            receiverId:
              message.receiverId,
          },
          'Message marked as read.'
        );
      } catch (error) {
        fastify.log.error(
          {
            error: error.message,
          },
          'Failed to mark message as read.'
        );

        if (
          typeof callback === 'function'
        ) {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );
}