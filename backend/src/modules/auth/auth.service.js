// src/modules/auth/auth.service.js

import { TokenService } from './auth.tokens.js';

import {
  hashPassword,
  verifyPassword,
} from '../../utils/password.js';

import { ConflictError } from '../../errors/ConflictError.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';

import { AuditService } from '../audit/audit.service.js';
import { SecurityService } from '../security/security.service.js';

import {
  AUDIT_ACTION,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../../utils/constants.js';

export class AuthService {
  constructor(fastify) {
    this.prisma = fastify.prisma;

    this.tokenService = new TokenService(fastify);

    this.auditService = new AuditService(fastify);

    this.securityService = new SecurityService(fastify);
  }

  /**
   * Register a new user.
   */
  async register({ username, email, password }) {
    return this.prisma.$transaction(async (tx) => {
      const existingEmail = await tx.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new ConflictError(
          'Email is already registered.'
        );
      }

      const existingUsername =
        await tx.user.findUnique({
          where: { username },
        });

      if (existingUsername) {
        throw new ConflictError(
          'Username is already taken.'
        );
      }

      const passwordHash =
        await hashPassword(password);

      const user = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
        },

        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });

      await this.auditService.log({
        userId: user.id,
        action: AUDIT_ACTION.REGISTER,
      });

      return {
        message: 'User registered successfully.',
        user,
      };
    });
  }

  /**
   * Authenticate user.
   */
  async login({ email, password }) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      await this.securityService.log({
        event: SECURITY_EVENT.FAILED_LOGIN,
        severity: SECURITY_SEVERITY.MEDIUM,
      });

      throw new AuthenticationError(
        'Invalid email or password.'
      );
    }

    const validPassword =
      await verifyPassword(
        password,
        user.passwordHash
      );

    if (!validPassword) {
      await this.securityService.log({
        userId: user.id,
        event: SECURITY_EVENT.FAILED_LOGIN,
        severity: SECURITY_SEVERITY.MEDIUM,
      });

      throw new AuthenticationError(
        'Invalid email or password.'
      );
    }

    const accessToken =
      this.tokenService.generateAccessToken(
        user
      );

    const refreshToken =
      await this.tokenService.generateRefreshToken(
        user
      );

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTION.LOGIN,
    });

    return {
      accessToken,
      refreshToken,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * Refresh an expired access token.
   */
  async refresh(refreshToken) {
    const payload =
      await this.tokenService.verifyRefreshToken(
        refreshToken
      );

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

    if (!user) {
      throw new AuthenticationError(
        'User not found.'
      );
    }

    // Rotate refresh token
    await this.tokenService.revokeRefreshToken(
      payload.jti
    );

    const newAccessToken =
      this.tokenService.generateAccessToken(
        user
      );

    const newRefreshToken =
      await this.tokenService.generateRefreshToken(
        user
      );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout current session.
   */
  async logout(accessToken, refreshToken = null) {
    const payload =
      this.tokenService.decodeToken(
        accessToken
      );

    if (!payload) {
      throw new AuthenticationError(
        'Invalid token.'
      );
    }

    const expiresInSeconds = Math.max(
      payload.exp -
        Math.floor(Date.now() / 1000),
      0
    );

    await this.tokenService.blacklistToken(
      payload.jti,
      expiresInSeconds
    );

    if (refreshToken) {
      const refreshPayload =
        await this.tokenService.verifyRefreshToken(
          refreshToken
        );

      await this.tokenService.revokeRefreshToken(
        refreshPayload.jti
      );
    }

    await this.auditService.log({
      userId: payload.sub,
      action: AUDIT_ACTION.LOGOUT,
    });

    return {
      message: 'Logged out successfully.',
    };
  }
}