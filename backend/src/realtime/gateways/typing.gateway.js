// src/realtime/gateways/typing.gateway.js

import { EVENTS } from '../events.js';
import { RoomManager } from '../managers/room.manager.js';

export function registerTypingHandlers(socket, io) {
  socket.on(
    EVENTS.TYPING_START,
    ({ receiverId }, callback) => {
      try {
        const senderId = socket.data.user.sub;

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

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
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
    EVENTS.TYPING_STOP,
    ({ receiverId }, callback) => {
      try {
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

        if (typeof callback === 'function') {
          callback({
            success: true,
          });
        }
      } catch (error) {
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