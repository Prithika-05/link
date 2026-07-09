// src/realtime/presence.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

export function registerPresenceGateway( io, fastify) {
  io.on('connection', async (socket) => {
    const user = socket.data.user;

    connectionManager.add(user.sub, socket);

    await fastify.prisma.user.update({
      where: {
        id: user.sub,
      },
      data: {
        status: 'ONLINE',
      },
    });

    io.emit(EVENTS.USER_ONLINE, {
      userId: user.sub,
    });

    socket.on('disconnect', async () => {
      connectionManager.remove(user.sub, socket);

      if (!connectionManager.has(user.sub)) {
        await fastify.prisma.user.update({
          where: {
            id: user.sub,
          },
          data: {
            status: 'OFFLINE',
          },
        });

        io.emit(EVENTS.USER_OFFLINE, {
          userId: user.sub,
        });
      }
    });
  });
}