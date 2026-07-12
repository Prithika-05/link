// src/modules/auth/auth.tokens.js

import { randomUUID } from 'node:crypto';

import { env } from '../../config/env.js';
import { REDIS_PREFIX } from '../../utils/constants.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
  }

  /**
   * Generate a JWT access token.
   *
   * @param {Object} user
   * @returns {string}
   */
  generateAccessToken(user) {
    return this.jwt.sign(
      {
        jti: randomUUID(),
        sub: user.id,
        email: user.email,
        username: user.username,
      },
      {
        expiresIn: env.jwtAccessExpiresIn,
      }
    );
  }

  /**
   * Decode a JWT without verifying it.
   *
   * @param {string} token
   * @returns {object|null}
   */
  decodeToken(token) {
    return this.jwt.decode(token);
  }

  /**
   * Verify JWT signature and claims.
   *
   * @param {string} token
   * @returns {Promise<object>}
   */
  async verifyToken(token) {
    try {
      return await this.jwt.verify(token);
    } catch {
      throw new AuthenticationError(
        'Invalid or expired token.'
      );
    }
  }

  /**
   * Add a JWT to the Redis blacklist.
   *
   * @param {string} jti
   * @param {number} expiresInSeconds
   */
  async blacklistToken(jti, expiresInSeconds) {
    const ttl = Math.max(
      Number(expiresInSeconds),
      1
    );

    await this.redis.set(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`,
      'revoked',
      'EX',
      ttl
    );
  }

  /**
   * Check whether a JWT has been revoked.
   *
   * @param {string} jti
   * @returns {Promise<boolean>}
   */
  async isBlacklisted(jti) {
    const token = await this.redis.get(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`
    );

    return token !== null;
  }
}