// src/modules/auth/auth.controller.js

import { AuthService } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export class AuthController {
  constructor(fastify) {
    this.authService = new AuthService(fastify);
  }

  /**
   * Build session metadata from the request.
   */
  getSessionInfo(request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,

      // Optional values supplied by the frontend
      deviceName: request.body?.deviceName ?? null,
      platform: request.body?.platform ?? null,
      browser: request.body?.browser ?? null,
    };
  }

  /**
   * Register
   */
  register = async (request, reply) => {
    const result = await this.authService.register(
      request.body
    );

    return successResponse(
      reply,
      result.user,
      result.message,
      201
    );
  };

  /**
   * Login
   */
  login = async (request, reply) => {
    const result =
      await this.authService.login(
        request.body,
        this.getSessionInfo(request)
      );

    return successResponse(
      reply,
      result,
      'Login successful.'
    );
  };

  /**
   * Refresh tokens
   */
  refresh = async (request, reply) => {
    const { refreshToken } = request.body;

    const result =
      await this.authService.refresh(
        refreshToken,
        this.getSessionInfo(request)
      );

    return successResponse(
      reply,
      result,
      'Tokens refreshed successfully.'
    );
  };

  /**
   * Logout current session
   */
  logout = async (request, reply) => {
    const authHeader =
      request.headers.authorization;

    const accessToken = authHeader?.replace(
      'Bearer ',
      ''
    );

    const { refreshToken } = request.body;

    await this.authService.logout(
      accessToken,
      refreshToken
    );

    return successResponse(
      reply,
      null,
      'Logged out successfully.'
    );
  };

  /**
   * List all active device sessions
   */
  getSessions = async (request, reply) => {
    const sessions =
      await this.authService.getSessions(
        request.user.sub
      );

    return successResponse(
      reply,
      sessions,
      'Device sessions retrieved successfully.'
    );
  };

  /**
   * Revoke one device session
   */
  revokeSession = async (
    request,
    reply
  ) => {
    const result =
      await this.authService.revokeSession(
        request.user.sub,
        request.params.sessionId
      );

    return successResponse(
      reply,
      null,
      result.message
    );
  };

  /**
   * Revoke all device sessions
   */
  revokeAllSessions = async (
    request,
    reply
  ) => {
    const result =
      await this.authService.revokeAllSessions(
        request.user.sub
      );

    return successResponse(
      reply,
      null,
      result.message
    );
  };
}