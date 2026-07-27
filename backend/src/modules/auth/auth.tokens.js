import { randomUUID } from "node:crypto";
import ms from "ms";
import { eq, and, desc } from "drizzle-orm";

import { env } from "../../config/env.js";
import { REDIS_PREFIX, TOKEN_TYPE } from "../../utils/constants.js";

import { AuthenticationError, NotFoundError } from "../../error.js";

import { refreshTokens, deviceSessions } from "../../db/schema.js";

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
    this.db = fastify.db;
  }

  /* Access Token */
  generateAccessToken(user) {
    return this.jwt.sign(
      {
        jti: randomUUID(),
        type: TOKEN_TYPE.ACCESS,
        sub: user.id,
        publicId: user.publicId,
        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
      },
      {
        expiresIn: env.jwtAccessExpiresIn,
      },
    );
  }

  /* Refresh Token */
  async generateRefreshToken(user, session = {}, parentTokenId = null) {
    const tokenId = randomUUID();

    const token = this.jwt.sign(
      {
        jti: tokenId,
        type: TOKEN_TYPE.REFRESH,
        sub: user.id,
      },
      {
        expiresIn: env.jwtRefreshExpiresIn,
      },
    );

    const expiresAt = new Date(Date.now() + ms(env.jwtRefreshExpiresIn));

    await this.db.transaction(async (tx) => {
      let parent = null;

      if (parentTokenId) {
        parent = await tx.query.refreshTokens.findFirst({
          where: eq(refreshTokens.tokenId, parentTokenId),
        });
      }

      const [refreshToken] = await tx
        .insert(refreshTokens)
        .values({
          tokenId,
          userId: user.id,
          expiresAt,
          parentId: parent?.id ?? null,
        })
        .returning();

      await tx.insert(deviceSessions).values({
        userId: user.id,
        refreshTokenId: refreshToken.id,
        deviceName: session.deviceName ?? null,
        platform: session.platform ?? null,
        browser: session.browser ?? null,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
      });
    });

    return token;
  }

  /* Token Validation */
  decodeToken(token) {
    return this.jwt.decode(token);
  }

  async verifyToken(token) {
    try {
      return await this.jwt.verify(token);
    } catch {
      throw new AuthenticationError("Invalid or expired token.");
    }
  }

  async verifyRefreshToken(token) {
    const payload = await this.verifyToken(token);

    if (payload.type !== TOKEN_TYPE.REFRESH) {
      throw new AuthenticationError("Invalid refresh token.");
    }

    const storedToken = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenId, payload.jti),
      with: {
        deviceSession: true,
      },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AuthenticationError(
        "Refresh token has expired or been revoked.",
      );
    }

    if (storedToken.deviceSession) {
      await this.db
        .update(deviceSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(deviceSessions.id, storedToken.deviceSession.id));
    }

    return payload;
  }

  /* Refresh Revocation */
  async revokeRefreshToken(tokenId) {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.tokenId, tokenId));
  }

  async revokeAllRefreshTokens(userId) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({ revoked: true })
        .where(
          and(
            eq(refreshTokens.userId, userId),
            eq(refreshTokens.revoked, false),
          ),
        );

      await tx.delete(deviceSessions).where(eq(deviceSessions.userId, userId));
    });
  }

  /* Device Sessions */
  async getDeviceSessions(userId) {
    const sessions = await this.db.query.deviceSessions.findMany({
      where: eq(deviceSessions.userId, userId),
      with: {
        refreshToken: true,
      },
      orderBy: [desc(deviceSessions.lastSeenAt)],
    });

    return sessions.filter((s) => s.refreshToken && !s.refreshToken.revoked);
  }

  async revokeDeviceSession(sessionId) {
    return this.db.transaction(async (tx) => {
      const session = await tx.query.deviceSessions.findFirst({
        where: eq(deviceSessions.id, sessionId),
      });

      if (!session) {
        throw new NotFoundError("Device session not found.");
      }

      await tx
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, session.refreshTokenId));

      await tx.delete(deviceSessions).where(eq(deviceSessions.id, sessionId));
    });
  }

  /* JWT Blacklist */
  async blacklistToken(jti, expiresInSeconds) {
    await this.redis.set(
      `${REDIS_PREFIX.JWT_BLACKLIST}${jti}`,
      "revoked",
      "EX",
      Math.max(Number(expiresInSeconds), 1),
    );
  }

  async isBlacklisted(jti) {
    const token = await this.redis.get(`${REDIS_PREFIX.JWT_BLACKLIST}${jti}`);
    return token !== null;
  }
}
