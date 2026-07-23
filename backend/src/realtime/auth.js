// src/realtime/auth.js

import { TokenService } from '../modules/auth/auth.tokens.js';
import { SecurityService } from '../modules/security/security.service.js';

import {
  SECURITY_EVENT,
  SECURITY_SEVERITY,
  TOKEN_TYPE,
} from '../utils/constants.js';

import { allowConnection } from './socket.rate-limit.js';

export function registerSocketAuth(io, fastify) {
  const tokenService = new TokenService(fastify);
  const securityService =
    new SecurityService(fastify);

  io.use(async (socket, next) => {
    const ipAddress =
      socket.handshake.address;

    const userAgent =
      socket.handshake.headers[
        'user-agent'
      ] ?? null;

    try {
      /**
       * Rate limiting.
       */
      if (!allowConnection(ipAddress)) {
        await securityService.log({
          event:
            SECURITY_EVENT.RATE_LIMIT_EXCEEDED,

          severity:
            SECURITY_SEVERITY.MEDIUM,

          ipAddress,

          metadata: {
            userAgent,
          },
        });

        return next(
          new Error(
            'Too many connection attempts.'
          )
        );
      }

      /**
       * Access token.
       */
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            'Authentication required.'
          )
        );
      }

      /**
       * Verify JWT.
       */
      const payload =
        await tokenService.verifyToken(
          token
        );

      if (
        !payload?.jti ||
        payload.type !==
          TOKEN_TYPE.ACCESS
      ) {
        return next(
          new Error(
            'Invalid access token.'
          )
        );
      }

      /**
       * Check blacklist.
       */
      const revoked =
        await tokenService.isBlacklisted(
          payload.jti
        );

      if (revoked) {
        await securityService.log({
          userId: payload.sub,

          event:
            SECURITY_EVENT.INVALID_JWT,

          severity:
            SECURITY_SEVERITY.MEDIUM,

          ipAddress,

          metadata: {
            userAgent,
          },
        });

        return next(
          new Error(
            'Token has been revoked.'
          )
        );
      }

      /**
       * Attach authenticated user.
       */
      socket.data.user = payload;

      fastify.log.debug(
        {
          socketId: socket.id,
          userId: payload.sub,
        },
        'Socket authenticated.'
      );

      return next();
    } catch (error) {
      await securityService.log({
        event:
          SECURITY_EVENT.SOCKET_AUTH_FAILED,

        severity:
          SECURITY_SEVERITY.MEDIUM,

        ipAddress,

        metadata: {
          userAgent,
          reason: error.message,
        },
      });

      fastify.log.warn(
        {
          socketId: socket.id,
          ipAddress,
          error: error.message,
        },
        'Socket authentication failed.'
      );

      return next(
        new Error('Unauthorized.')
      );
    }
  });
}