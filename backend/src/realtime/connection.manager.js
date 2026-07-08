// src/realtime/connection.manager.js

class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  add(userId, socket) {
    this.connections.set(userId, socket);
  }

  remove(userId) {
    this.connections.delete(userId);
  }

  get(userId) {
    return this.connections.get(userId);
  }

  has(userId) {
    return this.connections.has(userId);
  }

  onlineUsers() {
    return [...this.connections.keys()];
  }
}

export const connectionManager = new ConnectionManager();