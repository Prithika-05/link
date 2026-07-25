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

    if (
      connectionManager.getSocketCount(userId) === 1
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
        fastify.log.error(
          {
            userId,
            error,
          },
          'Failed updating user presence.'
        );
      }
    }

    socket.on(
      'disconnect',
      async (reason) => {
        if (
          !connectionManager.isConnected(
            userId
          )
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
            fastify.log.error(
              {
                userId,
                error,
              },
              'Failed updating user presence.'
            );
          }
        }
      }
    );
  });
}