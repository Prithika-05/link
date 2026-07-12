// src/realtime/auth.js

import { TokenService } from '../modules/auth/auth.tokens.js';
import { SecurityService } from '../modules/security/security.service.js';

import {
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../utils/constants.js';

import { allowConnection } from './socket.rate-limit.js';

export function registerSocketAuth(io, fastify) {
  const tokenService = new TokenService(fastify);
  const securityService = new SecurityService(fastify);

  io.use(async (socket, next) => {
    try {
      const ipAddress = socket.handshake.address;

      if (!allowConnection(ipAddress)) {
        await securityService.log({
          event: SECURITY_EVENT.RATE_LIMIT_EXCEEDED,
          severity: SECURITY_SEVERITY.MEDIUM,
          ipAddress,
        });

        return next(
          new Error('Too many connection attempts.')
        );
      }

      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error('Authentication required.')
        );
      }

      const payload =
        await tokenService.verifyToken(token);

      if (!payload?.jti) {
        return next(
          new Error('Invalid token.')
        );
      }

      const revoked =
        await tokenService.isBlacklisted(
          payload.jti
        );

      if (revoked) {
        await securityService.log({
          userId: payload.sub,

          event: SECURITY_EVENT.INVALID_JWT,

          severity: SECURITY_SEVERITY.MEDIUM,

          ipAddress,
        });

        return next(
          new Error('Token has been revoked.')
        );
      }

      socket.data.user = payload;

      fastify.log.debug(
        {
          socketId: socket.id,
          userId: payload.sub,
        },
        'Socket authenticated.'
      );

      next();
    } catch (error) {
      await securityService.log({
        event: SECURITY_EVENT.INVALID_JWT,

        severity: SECURITY_SEVERITY.MEDIUM,

        ipAddress: socket.handshake.address,
      });

      next(new Error('Unauthorized.'));
    }
  });
}