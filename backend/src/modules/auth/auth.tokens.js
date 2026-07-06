// src/modules/auth/auth.tokens.js

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
  }

  generateAccessToken(user) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  async blacklistToken(token, expiresInSeconds) {
    await this.redis.set(
      `blacklist:${token}`,
      'revoked',
      {
        EX: expiresInSeconds,
      }
    );
  }

  async isBlacklisted(token) {
    const exists = await this.redis.get(
      `blacklist:${token}`
    );

    return exists !== null;
  }
}