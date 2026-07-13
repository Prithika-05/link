// src/realtime/connection.manager.js

class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  addConnection(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections
      .get(userId)
      .add(socket);
  }

  /**
   * Backward compatibility.
   */
  add(userId, socket) {
    this.addConnection(userId, socket);
  }

  /**
   * Remove a socket connection.
   */
  removeConnection(userId, socket) {
    const sockets =
      this.connections.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socket);

    if (sockets.size === 0) {
      this.connections.delete(userId);
    }
  }

  /**
   * Backward compatibility.
   */
  remove(userId, socket) {
    this.removeConnection(
      userId,
      socket
    );
  }

  /**
   * Get all sockets for a user.
   */
  getSockets(userId) {
    return (
      this.connections.get(userId) ??
      new Set()
    );
  }

  /**
   * Backward compatibility.
   */
  get(userId) {
    return this.getSockets(userId);
  }

  /**
   * Whether user has at least one connection.
   */
  isConnected(userId) {
    return this.connections.has(userId);
  }

  /**
   * Backward compatibility.
   */
  has(userId) {
    return this.isConnected(userId);
  }

  /**
   * Number of active sockets.
   */
  getSocketCount(userId) {
    return this.getSockets(userId).size;
  }

  /**
   * Online user IDs.
   */
  getOnlineUsers() {
    return [
      ...this.connections.keys(),
    ];
  }

  /**
   * Emit to one user.
   */
  emit(userId, event, payload) {
    for (const socket of this.getSockets(
      userId
    )) {
      try {
        socket.emit(event, payload);
      } catch {
        // Ignore socket errors
      }
    }
  }

  /**
   * Broadcast to all users.
   */
  emitToAll(event, payload) {
    for (const sockets of this.connections.values()) {
      for (const socket of sockets) {
        try {
          socket.emit(event, payload);
        } catch {
          // Ignore socket errors
        }
      }
    }
  }

  /**
   * Disconnect every socket for a user.
   */
  disconnectUser(userId) {
    const sockets =
      this.getSockets(userId);

    for (const socket of sockets) {
      socket.disconnect(true);
    }

    this.connections.delete(userId);
  }

  /**
   * Remove every connection.
   */
  clear() {
    this.connections.clear();
  }
}

export const connectionManager =
  new ConnectionManager();