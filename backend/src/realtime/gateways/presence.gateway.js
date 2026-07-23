// src/realtime/gateways/presence.gateway.js

import { EVENTS } from '../events.js';
import { connectionManager } from '../connection.manager.js';

import {
  USER_STATUS,
} from '../../utils/constants.js';

export function registerPresenceGateway(
  io,
  fastify
) {
  io.on('connection', async (socket) => {
    const userId = socket.data.user.sub;

    /**
     * Register socket connection.
     */
    connectionManager.add(
      userId,
      socket
    );

    /**
     * Only notify when the first device
     * comes online.
     */
    if (
      connectionManager.get(userId).size === 1
    ) {
      try {
        await fastify.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            status: USER_STATUS.ONLINE,
          },
        });

        io.emit(EVENTS.USER_ONLINE, {
          userId,
        });

        fastify.log.debug(
          { userId },
          'User came online.'
        );
      } catch (error) {
        fastify.log.error(error);
      }
    }

    /**
     * Handle disconnect.
     */
    socket.on(
      'disconnect',
      async (reason) => {
        connectionManager.remove(
          userId,
          socket
        );

        /**
         * Only mark offline when
         * every socket has disconnected.
         */
        if (
          !connectionManager.has(userId)
        ) {
          try {
            await fastify.prisma.user.update({
              where: {
                id: userId,
              },
              data: {
                status:
                  USER_STATUS.OFFLINE,
              },
            });

            io.emit(
              EVENTS.USER_OFFLINE,
              {
                userId,
              }
            );

            fastify.log.debug(
              {
                userId,
                reason,
              },
              'User went offline.'
            );
          } catch (error) {
            fastify.log.error(error);
          }
        }
      }
    );
  });
}