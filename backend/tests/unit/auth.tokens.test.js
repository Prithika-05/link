import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenService } from "../../src/modules/auth/auth.tokens.js";

function makeFakeFastify() {
  const store = new Map();

  return {
    jwt: {
      sign: vi.fn((payload) => `signed.${JSON.stringify(payload)}.token`),
      decode: vi.fn((token) => {
        try {
          return JSON.parse(token.split(".")[1]);
        } catch {
          return null;
        }
      }),
    },
    redis: {
      set: vi.fn(async (key, value, mode, ttl) => {
        store.set(key, { value, ttl });
        return "OK";
      }),
      get: vi.fn(async (key) => {
        return store.has(key) ? store.get(key).value : null;
      }),
      _store: store,
    },
  };
}

describe("TokenService.generateAccessToken", () => {
  it("signs a payload containing sub, jti, email, username", () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    const user = {
      id: "user-1",
      email: "a@b.com",
      username: "alice",
    };

    service.generateAccessToken(user);

    expect(fastify.jwt.sign).toHaveBeenCalledOnce();
    const payload = fastify.jwt.sign.mock.calls[0][0];
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("a@b.com");
    expect(payload.username).toBe("alice");
    expect(payload.jti).toBeTypeOf("string");
    expect(payload.jti.length).toBeGreaterThan(10);
  });

  it("produces a fresh jti for every token", () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    service.generateAccessToken({ id: "u1", email: "a@b.com", username: "a" });
    service.generateAccessToken({ id: "u1", email: "a@b.com", username: "a" });

    const jti1 = fastify.jwt.sign.mock.calls[0][0].jti;
    const jti2 = fastify.jwt.sign.mock.calls[1][0].jti;
    expect(jti1).not.toBe(jti2);
  });

  it("does not include the password hash in the payload", () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    service.generateAccessToken({
      id: "u1",
      email: "a@b.com",
      username: "alice",
      passwordHash: "$2b$12$do-not-leak-me",
    });

    const payload = fastify.jwt.sign.mock.calls[0][0];
    expect(payload).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(payload)).not.toContain("do-not-leak-me");
  });
});

describe("TokenService.blacklistToken and isBlacklisted", () => {
  it("blacklisted jti reports true afterwards", async () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    await service.blacklistToken("jti-123", 900);
    const blacklisted = await service.isBlacklisted("jti-123");

    expect(blacklisted).toBe(true);
  });

  it("non-blacklisted jti reports false", async () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    const blacklisted = await service.isBlacklisted("jti-never-added");
    expect(blacklisted).toBe(false);
  });

  it("stores blacklist entries under the blacklist: prefix", async () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    await service.blacklistToken("jti-abc", 900);

    expect(fastify.redis._store.has("blacklist:jti-abc")).toBe(true);
  });

  it("passes the correct expiry so Redis auto-cleans expired blacklist entries", async () => {
    const fastify = makeFakeFastify();
    const service = new TokenService(fastify);

    await service.blacklistToken("jti-xyz", 900);

    expect(fastify.redis.set).toHaveBeenCalledWith(
      "blacklist:jti-xyz",
      "revoked",
      "EX",
      900,
    );
  });
});
