// src/realtime/gateways/message.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import { MessageService } from '../../modules/messages/messages.service.js';

import {
  MESSAGE_STATUS,
} from '../../utils/constants.js';

export function registerMessageGateway(
  io,
  fastify
) {
  const messageService =
    new MessageService(fastify);

  io.on('connection', (socket) => {
    socket.on(
      EVENTS.MESSAGE_SEND,
      async (payload, callback) => {
        try {
          const senderId =
            socket.data.user.sub;

          /**
           * Required encrypted payload.
           */
          const requiredFields = [
            'receiverId',
            'ciphertext',
            'iv',
            'authTag',
            'ephemeralPublicKey',
          ];

          for (const field of requiredFields) {
            if (!payload?.[field]) {
              throw new Error(
                `Missing required field: ${field}`
              );
            }
          }

          /**
           * Optional replay protection.
           */
          if (
            payload.nonce &&
            payload.timestamp &&
            payload.messageId
          ) {
            // TODO:
            // Verify nonce
            // Verify timestamp
            // Detect replay attacks
          }

          const message =
            await messageService.send(
              senderId,
              payload
            );

          /**
           * Sender acknowledgement.
           */
          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: true,

              data: {
                messageId:
                  message.id,

                status:
                  MESSAGE_STATUS.SENT,

                timestamp:
                  message.createdAt,
              },
            });
          }

          /**
           * Deliver if recipient is online.
           */
          if (
            connectionManager.has(
              payload.receiverId
            )
          ) {
            connectionManager.emit(
              payload.receiverId,
              EVENTS.MESSAGE_RECEIVE,
              message
            );
          }

          fastify.log.info(
            {
              messageId:
                message.id,

              senderId,

              receiverId:
                payload.receiverId,
            },
            'Encrypted message sent.'
          );
        } catch (error) {
          fastify.log.error(
            {
              senderId:
                socket.data.user.sub,

              error:
                error.message,
            },
            'Failed to send encrypted message.'
          );

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: false,

              message:
                error.message,
            });
          }
        }
      }
    );
  });
}