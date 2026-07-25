// src/realtime/room.manager.js

export class RoomManager {
  static conversationId(userA, userB) {
    return [userA, userB]
      .sort()
      .join(':');
  }

  static conversationRoom(conversationId) {
    return `conversation:${conversationId}`;
  }

  static userRoom(userId) {
    return `user:${userId}`;
  }

  static joinConversation(
    socket,
    userA,
    userB
  ) {
    const roomId = this.conversationRoom(
      this.conversationId(
        userA,
        userB
      )
    );

    socket.join(roomId);

    return roomId;
  }

  static leaveConversation(
    socket,
    userA,
    userB
  ) {
    const roomId = this.conversationRoom(
      this.conversationId(
        userA,
        userB
      )
    );

    socket.leave(roomId);

    return roomId;
  }
}