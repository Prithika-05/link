// src/realtime/presence.js

import { connectionManager } from './connection.manager.js';

export function userConnected(userId, socket) {
  connectionManager.addConnection(userId, socket);
}

export function userDisconnected(userId, socket) {
  connectionManager.removeConnection(userId, socket);
}

export function isOnline(userId) {
  return connectionManager.isConnected(userId);
}
export function onlineUsers() {
  return connectionManager.getOnlineUsers();
}