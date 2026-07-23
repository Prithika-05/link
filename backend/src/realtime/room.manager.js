// src/realtime/room.manager.js

export class RoomManager {
  static conversationId(userA, userB) {
    return [userA, userB]
      .sort()
      .join(':');
  }

  static joinConversation(socket, userA, userB) {
    socket.join(
      RoomManager.conversationId(userA, userB)
    );
  }

  static leaveConversation(socket, userA, userB) {
    socket.leave(
      RoomManager.conversationId(userA, userB)
    );
  }
}