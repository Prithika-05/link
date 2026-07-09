// src/realtime/message.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';
import { MessageService } from '../../modules/messages/messages.service.js';

export function registerMessageGateway( io, fastify) {
  const messageService = new MessageService(fastify);

  io.on('connection', (socket) => {
    socket.on(EVENTS.MESSAGE_SEND, async (payload, callback) => {
      try {
        const senderId = socket.data.user.sub;

        const result = await messageService.send(senderId, payload);

        if (callback) {
          callback({
            success: true,
            messageId: result.messageId,
          });
        }

        connectionManager.emit(
            payload.receiverId,
            EVENTS.MESSAGE_RECEIVE,
            {
                messageId: result.messageId,
                senderId,
                receiverId: payload.receiverId,
                ciphertext: payload.ciphertext,
                iv: payload.iv,
                authTag: payload.authTag,
                ephemeralPublicKey: payload.ephemeralPublicKey,
                createdAt: new Date().toISOString()
            }
        );
      } catch (error) {
        if (callback) {
          callback({
            success: false,
            message: error.message,
          });
        }

        fastify.log.error(error);
      }
    });
  });
}