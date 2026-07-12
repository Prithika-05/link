// src/realtime/gateways/message.gateway.js

/**
 * ---------------------------------------------------------
 * Message Gateway
 * ---------------------------------------------------------
 * Handles realtime encrypted messaging.
 *
 * Responsibilities:
 *  - Accept encrypted messages
 *  - Delegate validation/storage to MessageService
 *  - Deliver messages to online recipients
 *  - Acknowledge sender
 * ---------------------------------------------------------
 */

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import { MessageService } from '../../modules/messages/messages.service.js';

import { MESSAGE_STATUS } from '../../utils/constants.js';

export function registerMessageGateway(io, fastify) {
  const messageService = new MessageService(fastify);

  io.on('connection', (socket) => {
    socket.on(
      EVENTS.MESSAGE_SEND,
      async (payload, callback) => {
        try {
          const senderId = socket.data.user.sub;

          // Basic payload validation
          if (
            !payload?.messageId ||
            !payload?.timestamp ||
            !payload?.nonce
          ) {
            throw new Error(
              'Missing replay protection fields.'
            );
          }

          const message = await messageService.send(
            senderId,
            payload
          );

          // Acknowledge sender
          if (typeof callback === 'function') {
            callback({
              success: true,
              data: {
                messageId: message.id,
                status: MESSAGE_STATUS.SENT,
                timestamp: message.createdAt,
              },
            });
          }

          // Deliver to recipient if online
          if (
            connectionManager.isConnected(
              payload.receiverId
            )
          ) {
            connectionManager.emit(
              payload.receiverId,
              EVENTS.MESSAGE_RECEIVE,
              {
                id: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,

                ciphertext: message.ciphertext,
                iv: message.iv,
                authTag: message.authTag,
                ephemeralPublicKey:
                  message.ephemeralPublicKey,

                status: message.status,
                type: message.type,
                createdAt: message.createdAt,
              }
            );
          }

          fastify.log.info(
            {
              messageId: message.id,
              senderId,
              receiverId: payload.receiverId,
            },
            'Encrypted message delivered.'
          );
        } catch (error) {
          fastify.log.error(
            {
              error: error.message,
              senderId: socket.data.user.sub,
            },
            'Failed to send encrypted message.'
          );

          if (typeof callback === 'function') {
            callback({
              success: false,
              message: error.message,
            });
          }
        }
      }
    );
  });
}