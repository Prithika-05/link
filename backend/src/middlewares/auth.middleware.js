// src/middlewares/auth.middleware.js

import { TokenService } from '../modules/auth/auth.tokens.js';
import { SecurityService } from '../modules/security/security.service.js';

import { AuthenticationError } from '../errors/AuthenticationError.js';

import {
  TOKEN_TYPE,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../utils/constants.js';

/**
 * Authenticate incoming requests.
 *
 * Verifies:
 *  - JWT signature
 *  - Token type (ACCESS)
 *  - Token blacklist
 *
 * Attaches the verified payload to request.user.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function authenticate(request, reply) {
  const tokenService = new TokenService(request.server);
  const securityService = new SecurityService(request.server);

  try {
    /**
     * Verify JWT signature.
     */
    const payload = await request.jwtVerify();

    /**
     * Only access tokens are allowed.
     */
    if (payload.type !== TOKEN_TYPE.ACCESS) {
      throw new AuthenticationError(
        'Invalid token type.'
      );
    }

    /**
     * Every token must contain a unique identifier.
     */
    if (!payload.jti) {
      throw new AuthenticationError(
        'Invalid token.'
      );
    }

    /**
     * Check Redis blacklist.
     */
    const revoked =
      await tokenService.isBlacklisted(
        payload.jti
      );

    if (revoked) {
      throw new AuthenticationError(
        'Token has been revoked.'
      );
    }

    /**
     * Ensure downstream handlers use the verified payload.
     */
    request.user = payload;
  } catch (error) {
    await securityService.log({
      userId: request.user?.sub ?? null,

      event: SECURITY_EVENT.INVALID_JWT,

      severity: SECURITY_SEVERITY.MEDIUM,

      ipAddress: request.ip,

      metadata: {
        userAgent:
          request.headers['user-agent'] ?? null,
        reason: error.message,
      },
    });

    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError(
      'Authentication failed.'
    );
  }
}