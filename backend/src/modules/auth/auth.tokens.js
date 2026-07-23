// src/modules/auth/auth.tokens.js

import { randomUUID } from 'node:crypto';
import ms from 'ms';

import { env } from '../../config/env.js';
import {
  REDIS_PREFIX,
  TOKEN_TYPE,
} from '../../utils/constants.js';

import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
    this.prisma = fastify.prisma;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Access Token                                 */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                              Refresh Token                                */
  /* -------------------------------------------------------------------------- */

  async generateRefreshToken(user, session = {}) {
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

  /* -------------------------------------------------------------------------- */
  /*                             Token Validation                               */
  /* -------------------------------------------------------------------------- */

  decodeToken(token) {
    return this.jwt.decode(token);
  }

  async verifyToken(token) {
    try {
      return await this.jwt.verify(token);
    } catch {
      throw new AuthenticationError(
        'Invalid or expired token.'
      );
    }
  }

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

  /* -------------------------------------------------------------------------- */
  /*                              Refresh Revocation                            */
  /* -------------------------------------------------------------------------- */

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

  async revokeAllRefreshTokens(userId) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      }),

      this.prisma.deviceSession.deleteMany({
        where: {
          userId,
        },
      }),
    ]);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Device Sessions                               */
  /* -------------------------------------------------------------------------- */

  async getDeviceSessions(userId) {
    return this.prisma.deviceSession.findMany({
      where: {
        userId,

        refreshToken: {
          revoked: false,
        },
      },

      orderBy: {
        lastSeenAt: 'desc',
      },
    });
  }

  async revokeDeviceSession(sessionId) {
    return this.prisma.$transaction(async (tx) => {
      const session =
        await tx.deviceSession.findUnique({
          where: {
            id: sessionId,
          },
        });

      if (!session) {
        throw new NotFoundError(
          'Device session not found.'
        );
      }

      await tx.refreshToken.update({
        where: {
          id: session.refreshTokenId,
        },
        data: {
          revoked: true,
        },
      });

      await tx.deviceSession.delete({
        where: {
          id: sessionId,
        },
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                              JWT Blacklist                                 */
  /* -------------------------------------------------------------------------- */

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

  async isBlacklisted(jti) {
    const token = await this.redis.get(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`
    );

    return token !== null;
  }
}