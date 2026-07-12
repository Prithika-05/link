// src/modules/auth/auth.tokens.js

import { randomUUID } from 'node:crypto';
import ms from 'ms';

import { env } from '../../config/env.js';
import {
  REDIS_PREFIX,
  TOKEN_TYPE,
} from '../../utils/constants.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
    this.prisma = fastify.prisma;
  }

  /**
   * Generate an access token.
   */
  generateAccessToken(user) {
    return this.jwt.sign(
      {
        jti: randomUUID(),
        type: TOKEN_TYPE.ACCESS,
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
   * Generate a refresh token and create a device session.
   *
   * @param {Object} user
   * @param {Object} session
   */
  async generateRefreshToken(
    user,
    session = {}
  ) {
    const tokenId = randomUUID();

    const token = this.jwt.sign(
      {
        jti: tokenId,
        type: TOKEN_TYPE.REFRESH,
        sub: user.id,
      },
      {
        expiresIn: env.jwtRefreshExpiresIn,
      }
    );

    const expiresAt = new Date(
      Date.now() + ms(env.jwtRefreshExpiresIn)
    );

    await this.prisma.$transaction(async (tx) => {
      const refreshToken =
        await tx.refreshToken.create({
          data: {
            tokenId,
            userId: user.id,
            expiresAt,
          },
        });

      await tx.deviceSession.create({
        data: {
          userId: user.id,
          refreshTokenId: refreshToken.id,

          deviceName:
            session.deviceName ?? null,

          platform:
            session.platform ?? null,

          browser:
            session.browser ?? null,

          ipAddress:
            session.ipAddress ?? null,

          userAgent:
            session.userAgent ?? null,
        },
      });
    });

    return token;
  }

  /**
   * Decode without verification.
   */
  decodeToken(token) {
    return this.jwt.decode(token);
  }

  /**
   * Verify any JWT.
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
   * Verify refresh token.
   */
  async verifyRefreshToken(token) {
    const payload =
      await this.verifyToken(token);

    if (payload.type !== TOKEN_TYPE.REFRESH) {
      throw new AuthenticationError(
        'Invalid refresh token.'
      );
    }

    const storedToken =
      await this.prisma.refreshToken.findUnique({
        where: {
          tokenId: payload.jti,
        },
        include: {
          deviceSession: true,
        },
      });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AuthenticationError(
        'Refresh token has expired or been revoked.'
      );
    }

    // Update last activity
    if (storedToken.deviceSession) {
      await this.prisma.deviceSession.update({
        where: {
          id: storedToken.deviceSession.id,
        },
        data: {
          lastSeenAt: new Date(),
        },
      });
    }

    return payload;
  }

  /**
   * Revoke one refresh token.
   */
  async revokeRefreshToken(tokenId) {
    await this.prisma.refreshToken.update({
      where: {
        tokenId,
      },
      data: {
        revoked: true,
      },
    });
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllRefreshTokens(userId) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  }

  /**
   * Get active sessions.
   */
  async getDeviceSessions(userId) {
    return this.prisma.deviceSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });
  }

  /**
   * Remove a single device session.
   */
  async revokeDeviceSession(sessionId) {
    return this.prisma.deviceSession.delete({
      where: {
        id: sessionId,
      },
    });
  }

  /**
   * Blacklist access token.
   */
  async blacklistToken(
    jti,
    expiresInSeconds
  ) {
    await this.redis.set(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`,
      'revoked',
      'EX',
      Math.max(Number(expiresInSeconds), 1)
    );
  }

  /**
   * Check blacklist.
   */
  async isBlacklisted(jti) {
    const token = await this.redis.get(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`
    );

    return token !== null;
  }
}