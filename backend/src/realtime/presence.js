// src/realtime/presence.js

import { connectionManager } from './connection.manager.js';

export function userConnected(userId, socket) {
  connectionManager.add(userId, socket);
}

export function userDisconnected(userId) {
  connectionManager.remove(userId);
}

export function isOnline(userId) {
  return connectionManager.has(userId);
}

export function onlineUsers() {
  return connectionManager.onlineUsers();
}