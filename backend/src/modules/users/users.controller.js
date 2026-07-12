// src/modules/users/users.controller.js

import { UsersService } from './users.service.js';
import { successResponse } from '../../utils/response.js';

export class UsersController {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.usersService = new UsersService(fastify);
  }

  /**
   * Get the authenticated user's profile.
   */
  getCurrentUser = async (request, reply) => {
    const user = await this.usersService.getCurrentUser(
      request.user.sub
    );

    return successResponse(
      reply,
      user,
      'User profile retrieved successfully.'
    );
  };

  /**
   * Get a public user profile by ID.
   */
  getUserById = async (request, reply) => {
    const user = await this.usersService.getUserById(
      request.params.id
    );

    return successResponse(
      reply,
      user,
      'User retrieved successfully.'
    );
  };

  /**
   * Update the authenticated user's profile.
   */
  updateProfile = async (request, reply) => {
    const user = await this.usersService.updateProfile(
      request.user.sub,
      request.body
    );

    return successResponse(
      reply,
      user,
      'Profile updated successfully.'
    );
  };

  /**
   * Search users.
   */
  searchUsers = async (request, reply) => {
    const { q, page, limit } = request.query;

    const result = await this.usersService.searchUsers(
      q,
      page,
      limit
    );

    return successResponse(
      reply,
      result,
      'Users retrieved successfully.'
    );
  };
}