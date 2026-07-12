// src/modules/auth/auth.controller.js

import { AuthService } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export class AuthController {

  constructor(fastify) {
    this.authService = new AuthService(fastify);
  }

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


  login = async (request, reply) => {
    const result =
      await this.authService.login(request.body);

    return successResponse(
      reply,
      result,
      'Login successful.'
    );
  };

  refresh = async (request, reply) => {
    const { refreshToken } = request.body;

    const result =
      await this.authService.refresh(
        refreshToken
      );

    return successResponse(
      reply,
      result,
      'Tokens refreshed successfully.'
    );
  };


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
}