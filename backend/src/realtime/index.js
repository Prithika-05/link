// src/realtime/index.js

import { registerPresenceHandlers } from './gateways/presence.gateway.js';
import { registerMessageHandlers } from './gateways/message.gateway.js';
import { registerReceiptHandlers } from './gateways/receipt.gateway.js';
import {registerTypingHandlers} from './gateways/typing.gateway.js';

export function registerRealtime(io, fastify) {
  io.on('connection', (socket) => {
    fastify.log.info(
      `Socket connected: ${socket.data.user.username}`
    );

    registerPresenceHandlers(socket, io, fastify);
    registerMessageHandlers(socket, io, fastify);
    registerTypingHandlers(socket, io, fastify);
    registerReceiptHandlers(socket, io, fastify);

    socket.on('disconnect', () => {
      fastify.log.info(
        `Socket disconnected: ${socket.data.user.username}`
      );
    });
  });
}