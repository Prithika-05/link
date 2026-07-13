// src/realtime/gateways/typing.gateway.js

import { EVENTS } from '../events.js';
import { RoomManager } from '../room.manager.js';

export function registerTypingHandlers(
  socket,
  io,
  fastify
) {
  /**
   * Typing started.
   */
  socket.on(
    EVENTS.TYPING_START,
    ({ receiverId }, callback) => {
      try {
        if (!receiverId) {
          throw new Error(
            'Receiver ID is required.'
          );
        }

        const senderId = socket.data.user.sub;

        RoomManager.joinConversation(
          socket,
          senderId,
          receiverId
        );

        const roomId =
          RoomManager.conversationId(
            senderId,
            receiverId
          );

        socket.to(roomId).emit(
          EVENTS.TYPING_START,
          {
            senderId,
          }
        );

        fastify?.log?.debug(
          {
            senderId,
            receiverId,
          },
          'Typing started.'
        );

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
        fastify?.log?.error(error);

        if (typeof callback === 'function') {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );

  /**
   * Typing stopped.
   */
  socket.on(
    EVENTS.TYPING_STOP,
    ({ receiverId }, callback) => {
      try {
        if (!receiverId) {
          throw new Error(
            'Receiver ID is required.'
          );
        }

        const senderId = socket.data.user.sub;

        const roomId =
          RoomManager.conversationId(
            senderId,
            receiverId
          );

        socket.to(roomId).emit(
          EVENTS.TYPING_STOP,
          {
            senderId,
          }
        );

        fastify?.log?.debug(
          {
            senderId,
            receiverId,
          },
          'Typing stopped.'
        );

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
        fastify?.log?.error(error);

        if (typeof callback === 'function') {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    }
  );

  /**
   * Leave all rooms on disconnect.
   */
  socket.on('disconnect', () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
  });
}