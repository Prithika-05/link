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
    const user =
      await this.usersService.getCurrentUser(
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
    const user =
      await this.usersService.getUserById(
        request.params.id
      );

    return successResponse(
      reply,
      user,
      'User retrieved successfully.'
    );
  };

  /**
   * Get a public user profile by username.
   */
  getUserByUsername = async (
    request,
    reply
  ) => {
    const user =
      await this.usersService.getUserByUsername(
        request.params.username
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
  updateProfile = async (
    request,
    reply
  ) => {
    const user =
      await this.usersService.updateProfile(
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
   * Change password.
   */
  changePassword = async (
    request,
    reply
  ) => {
    const {
      currentPassword,
      newPassword,
    } = request.body;

    const result =
      await this.usersService.changePassword(
        request.user.sub,
        currentPassword,
        newPassword
      );

    return successResponse(
      reply,
      null,
      result.message
    );
  };

  /**
   * Search users.
   */
  searchUsers = async (
    request,
    reply
  ) => {
    const {
      q,
      page,
      limit,
    } = request.query;

    const result =
      await this.usersService.searchUsers(
        request.user.sub,
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