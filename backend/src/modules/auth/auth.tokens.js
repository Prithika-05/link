// src/modules/auth/auth.tokens.js

import { randomUUID } from 'node:crypto';

import ms from 'ms';

import { env } from '../../config/env.js';
import { REDIS_PREFIX, TOKEN_TYPE } from '../../utils/constants.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
    this.prisma = fastify.prisma;
  }

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

  async generateRefreshToken(user) {
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

    await this.prisma.refreshToken.create({
      data: {
        tokenId,
        userId: user.id,
        expiresAt,
      },
    });

    return token;
  }

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
    const payload = await this.verifyToken(token);

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

    return payload;
  }

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

  async blacklistToken(jti, expiresInSeconds) {
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