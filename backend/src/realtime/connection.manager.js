// src/realtime/connection.manager.js

class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  addConnection(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId).add(socket);
  }

  removeConnection(userId, socket) {
    const sockets = this.connections.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socket);

    if (sockets.size === 0) {
      this.connections.delete(userId);
    }
  }

  getSockets(userId) {
    return this.connections.get(userId) ?? new Set();
  }

  isConnected(userId) {
    return this.connections.has(userId);
  }

  getOnlineUsers() {
    return [...this.connections.keys()];
  }

  getSocketCount(userId) {
    return this.getSockets(userId).size;
  }

  emit(userId, event, payload) {
    for (const socket of this.getSockets(userId)) {
      socket.emit(event, payload);
    }
  }

  emitToAll(event, payload) {
    for (const sockets of this.connections.values()) {
      for (const socket of sockets) {
        socket.emit(event, payload);
      }
    }
  }
}

export const connectionManager =
  new ConnectionManager();