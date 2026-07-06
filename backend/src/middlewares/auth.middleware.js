// src/middlewares/auth.middleware.js

import { TokenService } from '../modules/auth/auth.tokens.js';

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();

    const tokenService = new TokenService(request.server);

    const { jti } = request.user;

    if (await tokenService.isBlacklisted(jti)) {
      return reply.code(401).send({
        success: false,
        message: 'Token has been revoked.',
      });
    }
  } catch (error) {
    return reply.code(401).send({
      success: false,
      message: 'Unauthorized',
    });
  }
}