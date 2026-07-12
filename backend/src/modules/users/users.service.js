// src/modules/users/users.service.js

import { NotFoundError } from '../../errors/NotFoundError.js';
import { ValidationError } from '../../errors/ValidationError.js';

import { getPagination, buildPagination } from '../../utils/pagination.js';

export class UsersService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
  }

  /**
   * Get the currently authenticated user.
   *
   * @param {string} userId
   */
  async getCurrentUser(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  }

  /**
   * Get user by ID.
   *
   * @param {string} userId
   */
  async getUserById(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  }

  /**
   * Update current user's profile.
   *
   * @param {string} userId
   * @param {{username:string}} data
   */
  async updateProfile(userId, data) {
    const existing = await this.prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: {
          id: userId,
        },
      },
    });

    if (existing) {
      throw new ValidationError(
        'Username is already in use.'
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        username: data.username,
      },

      select: {
        id: true,
        username: true,
        email: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Search users by username.
   *
   * @param {string} query
   * @param {number} page
   * @param {number} limit
   */
  async searchUsers(query, page, limit) {
    const pagination = getPagination(page, limit);

    const where = {
      username: {
        contains: query,
        mode: 'insensitive',
      },
    };

    const [users, total] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,

          skip: pagination.skip,

          take: pagination.limit,

          orderBy: {
            username: 'asc',
          },

          select: {
            id: true,
            username: true,
          },
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

    return {
      users,

      pagination: buildPagination(
        pagination.page,
        pagination.limit,
        total
      ),
    };
  }
}