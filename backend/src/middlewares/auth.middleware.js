// src/middlewares/auth.middleware.js

import { TokenService } from '../modules/auth/auth.tokens.js';

import { AuthenticationError } from '../errors/AuthenticationError.js';

import {
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../utils/constants.js';

import { SecurityService } from '../modules/security/security.service.js';

/**
 * Authenticate incoming requests.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function authenticate(request, reply) {
  try {
    /**
     * Verify JWT signature and claims.
     */
    await request.jwtVerify();

    const tokenService = new TokenService(request.server);

    const securityService = new SecurityService(request.server);

    const { jti } = request.user;

    if (!jti) {
      throw new AuthenticationError('Invalid token.');
    }

    const revoked =
      await tokenService.isBlacklisted(jti);

    if (revoked) {
      await securityService.log({
        userId: request.user.sub,

        event: SECURITY_EVENT.INVALID_JWT,

        severity: SECURITY_SEVERITY.MEDIUM,

        ipAddress: request.ip,
      });

      throw new AuthenticationError(
        'Token has been revoked.'
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError(
      'Authentication failed.'
    );
  }
}