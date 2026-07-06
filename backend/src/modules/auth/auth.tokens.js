// src/modules/auth/auth.tokens.js
import { randomUUID } from "node:crypto";

export class TokenService {
  constructor(fastify) {
    this.jwt = fastify.jwt;
    this.redis = fastify.redis;
  }

generateAccessToken(user) {
  const payload = {
    jti: randomUUID(),
    sub: user.id,
    email: user.email,
    username: user.username,
  };

  console.log(payload);

  return this.jwt.sign(payload);
}
   decodeToken(token) {
    return this.jwt.decode(token);
  }

  async blacklistToken(jti, expiresInSeconds) {
    await this.redis.set(
      `blacklist:${jti}`,
      "revoked",
      "EX",
      expiresInSeconds
    );
  }

  async isBlacklisted(jti) {
    const exists = await this.redis.get(`blacklist:${jti}`);
    return exists !== null;
  }
}