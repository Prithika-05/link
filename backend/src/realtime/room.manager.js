// src/realtime/room.manager.js

export class RoomManager {
  static conversationId(userA, userB) {
    return [userA, userB].sort().join(':');
  }

  static joinConversation(socket, userA, userB) {
    socket.join(
      this.conversationId(userA, userB)
    );
  }

  static leaveConversation(socket, userA, userB) {
    socket.leave(
      this.conversationId(userA, userB)
    );
  }
}