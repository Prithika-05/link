// src/realtime/socket.js

import { Server } from 'socket.io';
import { registerSocketAuth } from './auth.js';
import { registerMessageGateway } from './gateways/message.gateway.js';
import { registerPresenceGateway } from './gateways/presence.gateway.js';
import { setupRedisAdapter } from './redis.adapter.js';

let io;

/**
 * Initialize the Socket.IO server.
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function initializeSocket(fastify) {
  io = new Server(fastify.server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://your-frontend-domain.com']
          : true,

      credentials: true,

      methods: ['GET', 'POST'],
    },

    transports: ['websocket'],
  });

  await setupRedisAdapter(io, fastify.log);

  registerSocketAuth(io, fastify);
  registerPresenceGateway(io, fastify);
  registerMessageGateway(io, fastify);

  fastify.log.info('Socket.IO initialized');

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized.'
    );
  }

  return io;
}