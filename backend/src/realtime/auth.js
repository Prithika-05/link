// src/realtime/auth.js

import { TokenService } from '../modules/auth/auth.tokens.js';

export function registerSocketAuth(io, fastify) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required.'));
      }

      const payload = fastify.jwt.verify(token);

      const tokenService = new TokenService(fastify);

      if (await tokenService.isBlacklisted(payload.jti)) {
        return next(new Error('Token has been revoked.'));
      }

      socket.data.user = payload;

      next();
    } catch (error) {
      next(new Error('Unauthorized.'));
    }
  });
}