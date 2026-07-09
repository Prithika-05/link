// src/realtime/connection.manager.js

class ConnectionManager {
  constructor() {
    /**
     * Map<
     *   userId,
     *   Set<Socket>
     * >
     */
    this.connections = new Map();
  }

  add(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId).add(socket);
  }

  remove(userId, socket) {
    const sockets = this.connections.get(userId);

    if (!sockets) return;

    sockets.delete(socket);

    if (sockets.size === 0) {
      this.connections.delete(userId);
    }
  }

  get(userId) {
    return this.connections.get(userId) || new Set();
  }

  has(userId) {
    return this.connections.has(userId);
  }

  getOnlineUsers() {
    return [...this.connections.keys()];
  }

  emit(userId, event, payload) {
    const sockets = this.get(userId);

    for (const socket of sockets) {
      socket.emit(event, payload);
    }
  }
}

export const connectionManager = new ConnectionManager();