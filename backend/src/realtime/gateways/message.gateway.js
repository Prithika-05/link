// src/realtime/gateways/message.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import { MessageService } from '../../modules/messages/messages.service.js';

import {
  MESSAGE_STATUS,
} from '../../utils/constants.js';

export function registerMessageGateway(io, fastify) {
  const messageService = new MessageService(fastify);

  io.on('connection', (socket) => {
    socket.on(
      EVENTS.MESSAGE_SEND,
      async (payload, callback) => {
        try {
          const senderId =
            socket.data.user.sub;
          const message =
            await messageService.send(
              senderId,
              payload
            );
          if (typeof callback === 'function') {
            callback({
              success: true,

              messageId: message.id,

              status: MESSAGE_STATUS.SENT,

              timestamp:
                message.createdAt,
            });
          }
          if (
            connectionManager.isConnected(
              payload.receiverId
            )
          ) {
            connectionManager.emit(
              payload.receiverId,

              EVENTS.MESSAGE_RECEIVE,

              message
            );
          }

          fastify.log.debug(
            {
              messageId: message.id,
              senderId,
              receiverId:
                payload.receiverId,
            },
            'Encrypted message sent.'
          );
        } catch (error) {
          fastify.log.error(error);

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