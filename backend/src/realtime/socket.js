// src/realtime/socket.js

import { Server } from 'socket.io';

import { env } from '../config/env.js';

import { registerSocketAuth } from './auth.js';

import { registerPresenceGateway } from './gateways/presence.gateway.js';
import { registerMessageGateway } from './gateways/message.gateway.js';
import { registerReceiptHandlers } from './gateways/receipt.gateway.js';
import { registerTypingHandlers } from './gateways/typing.gateway.js';
import { connectionManager } from './connection.manager.js';
import { setupRedisAdapter } from './redis.adapter.js';

let io = null;

/**
 * Initialize Socket.IO.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function initializeSocket(
  fastify
) {
  if (io) {
    return io;
  }

  io = new Server(fastify.server, {
    cors: {
      origin: env.isProduction
        ? env.corsOrigins
        : true,

      credentials: true,

      methods: [
        'GET',
        'POST',
        'PATCH',
      ],
    },

    transports: ['websocket'],
  });

  /**
   * Redis adapter.
   */
  await setupRedisAdapter(
    io,
    fastify.log
  );

  /**
   * Socket authentication.
   */
  registerSocketAuth(io, fastify);

  /**
   * Presence management.
   */
  registerPresenceGateway(
    io,
    fastify
  );

  /**
   * Message gateway.
   */
  registerMessageGateway(
    io,
    fastify
  );

  /**
   * Register per-socket handlers.
   */
  io.on('connection', (socket) => {
      const userId = socket.data.user.sub;

      connectionManager.add(userId, socket);

      registerReceiptHandlers(socket, io, fastify);
      registerTypingHandlers(socket, io, fastify);

      fastify.log.debug(
          {
              socketId: socket.id,
              userId,
          },
          'Socket connected.'
      );

      socket.on('disconnect', (reason) => {
          connectionManager.remove(userId, socket);

          fastify.log.debug(
              {
                  socketId: socket.id,
                  userId,
                  reason,
              },
              'Socket disconnected.'
          );
      });
  });

  fastify.log.info(
    'Socket.IO initialized.'
  );

  return io;
}

/**
 * Get initialized Socket.IO instance.
 */
export function getIO() {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized.'
    );
  }

  return io;
}