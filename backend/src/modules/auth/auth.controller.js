// src/modules/auth/auth.controller.js

import { AuthService } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export class AuthController {
  constructor(fastify) {
    this.authService = new AuthService(fastify);
  }

  getSessionInfo(request) {
    const body = request.body ?? {};

    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
      deviceName: body.deviceName ?? null,
      platform: body.platform ?? null,
      browser: body.browser ?? null,
    };
  }

  /**
   * Register a new user.
   */
  register = async (request, reply) => {
    try {
      const result = await this.authService.register(request.body);

      return successResponse(
        reply,
        result.user,
        result.message,
        201
      );
    } catch (error) {
      // Passes the specific validation/database error down to Fastify's handler
      throw error; 
    }
  };

  /**
   * Login.
   */
  login = async (request, reply) => {
    try {
      const result = await this.authService.login(
        request.body,
        this.getSessionInfo(request)
      );

      return successResponse(
        reply,
        result,
        'Login successful.'
      );
    }catch (error) {
  request.log.error(error);

  console.error(error);

  throw error;
}
  };

  /**
   * Refresh authentication tokens.
   */
  refresh = async (request, reply) => {
    try {
      const { refreshToken } = request.body;

      const result = await this.authService.refresh(
        refreshToken,
        this.getSessionInfo(request)
      );

      return successResponse(
        reply,
        result,
        'Tokens refreshed successfully.'
      );
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: error.message || 'Session expired or invalid refresh token.'
        }
      });
    }
  };

  /**
   * Logout current session.
   */
  logout = async (request, reply) => {
    try {
      const authHeader = request.headers.authorization ?? '';
      const accessToken = authHeader.replace(/^Bearer\s+/i, '');
      const { refreshToken } = request.body ?? {};

      await this.authService.logout(
        accessToken,
        refreshToken,
        this.getSessionInfo(request)
      );

      return successResponse(reply, null, 'Logged out successfully.');
    } catch (error) {
      throw error;
    }
  };

  /**
   * List active device sessions.
   */
  getSessions = async (request, reply) => {
    try {
      const sessions = await this.authService.getSessions(request.user.sub);
      return successResponse(reply, sessions, 'Device sessions retrieved successfully.');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Revoke one device session.
   */
  revokeSession = async (request, reply) => {
    try {
      const result = await this.authService.revokeSession(
        request.user.sub,
        request.params.sessionId
      );
      return successResponse(reply, null, result.message);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Revoke all device sessions.
   */
  revokeAllSessions = async (request, reply) => {
    try {
      const result = await this.authService.revokeAllSessions(request.user.sub);
      return successResponse(reply, null, result.message);
    } catch (error) {
      throw error;
    }
  };
}
