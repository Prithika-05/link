// src/realtime/events.js

export const EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',

  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',

  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
};