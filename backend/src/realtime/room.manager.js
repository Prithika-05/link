// src/realtime/room.manager.js

export class RoomManager {
  static conversationRoom(conversationId) {
    return `conversation:${conversationId}`;
  }

  static userRoom(userId) {
    return `user:${userId}`;
  }
}