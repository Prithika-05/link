// src/modules/auth/auth.controller.js

import { AuthService } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export class AuthController {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.authService = new AuthService(fastify);
  }

  /**
   * Register a new user.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  register = async (request, reply) => {
    const user = await this.authService.register(request.body);

    return successResponse(
      reply,
      user,
      'User registered successfully.',
      201
    );
  };

  /**
   * Login a user.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  login = async (request, reply) => {
    const result = await this.authService.login(request.body);

    return successResponse(
      reply,
      result,
      'Login successful.'
    );
  };

  /**
   * Logout the authenticated user.
   *
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  logout = async (request, reply) => {
    const authHeader =
      request.headers.authorization;

    const token = authHeader?.replace(
      'Bearer ',
      ''
    );

    await this.authService.logout(token);

    return successResponse(
      reply,
      null,
      'Logged out successfully.'
    );
  };
}