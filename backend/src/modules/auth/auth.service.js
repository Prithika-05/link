import { TokenService } from "./auth.tokens.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";

import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
} from "../../error.js";

import { AuditService } from "../audit/audit.service.js";
import { SecurityService } from "../security/security.service.js";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { users, deviceSessions } from "../../db/schema.js";
import {
  AUDIT_ACTION,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
  TOKEN_TYPE,
} from "../../utils/constants.js";

export class AuthService {
  constructor(fastify) {
    this.db = fastify.db;
    this.tokenService = new TokenService(fastify);
    this.auditService = new AuditService(fastify);
    this.securityService = new SecurityService(fastify);
  }

  /**
   * Register a new user.
   */
  async register({ username, displayName, email, password }) {
    const passwordHash = await hashPassword(password);

    const user = await this.db.transaction(async (tx) => {
      const existingEmail = await tx.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        throw new ConflictError("Email is already registered.");
      }

      const existingUsername = await tx.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUsername) {
        throw new ConflictError("Username is already taken.");
      }

      const [newUser] = await tx
        .insert(users)
        .values({
          publicId: randomUUID(),
          username,
          displayName: displayName || username, // Default to username if not provided
          email,
          passwordHash,
        })
        .returning({
          id: users.id,
          publicId: users.publicId,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          createdAt: users.createdAt,
        });

      return newUser;
    });

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTION.REGISTER,
    });

    return {
      message: "User registered successfully.",
      user,
    };
  }

  /**
   * Authenticate user.
   */
  async login(credentials, session = {}) {
    const { email, password } = credentials;

    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      await this.securityService.log({
        event: SECURITY_EVENT.FAILED_LOGIN,
        severity: SECURITY_SEVERITY.MEDIUM,
        ipAddress: session.ipAddress,
      });

      throw new AuthenticationError("Invalid email or password.");
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      await this.securityService.log({
        userId: user.id,
        event: SECURITY_EVENT.FAILED_LOGIN,
        severity: SECURITY_SEVERITY.MEDIUM,
        ipAddress: session.ipAddress,
        metadata: {
          userAgent: session.userAgent,
        },
      });

      throw new AuthenticationError("Invalid email or password.");
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user,
      session,
    );

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTION.LOGIN,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        publicId: user.publicId,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
    };
  }

  /**
   * Refresh authentication tokens.
   */
  async refresh(refreshToken, session = {}) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new AuthenticationError("User not found.");
    }

    const result = await this.db.transaction(async () => {
      await this.tokenService.revokeRefreshToken(payload.jti);

      const accessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = await this.tokenService.generateRefreshToken(
        user,
        session,
        payload.jti,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTION.TOKEN_REFRESH,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return result;
  }

  /**
   * Logout current session.
   */
  async logout(accessToken, refreshToken = null, session = {}) {
    const payload = await this.tokenService.verifyToken(accessToken);

    if (!payload) {
      throw new AuthenticationError("Invalid token.");
    }

    if (payload.type !== TOKEN_TYPE.ACCESS) {
      throw new AuthenticationError("Invalid access token.");
    }

    const expiresInSeconds = Math.max(
      payload.exp - Math.floor(Date.now() / 1000),
      0,
    );

    await this.tokenService.blacklistToken(payload.jti, expiresInSeconds);

    if (refreshToken) {
      const refreshPayload =
        await this.tokenService.verifyRefreshToken(refreshToken);
      await this.tokenService.revokeRefreshToken(refreshPayload.jti);
    }

    await this.auditService.log({
      userId: payload.sub,
      action: AUDIT_ACTION.LOGOUT,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return {
      message: "Logged out successfully.",
    };
  }

  /**
   * List active device sessions.
   */
  async getSessions(userId) {
    return this.tokenService.getDeviceSessions(userId);
  }

  /**
   * Revoke a single device session.
   */
  async revokeSession(userId, sessionId) {
    const session = await this.db.query.deviceSessions.findFirst({
      where: eq(deviceSessions.id, sessionId),
    });

    if (!session) {
      throw new NotFoundError("Session not found.");
    }

    if (session.userId !== userId) {
      throw new AuthenticationError("Unauthorized.");
    }

    await this.tokenService.revokeDeviceSession(sessionId);

    await this.auditService.log({
      userId,
      action: AUDIT_ACTION.SESSION_REVOKED,
    });

    return {
      message: "Device session revoked successfully.",
    };
  }

  /**
   * Revoke all active sessions.
   */
  async revokeAllSessions(userId) {
    await this.tokenService.revokeAllRefreshTokens(userId);

    await this.auditService.log({
      userId,
      action: AUDIT_ACTION.ALL_SESSIONS_REVOKED,
    });

    return {
      message: "All device sessions revoked successfully.",
    };
  }
}
