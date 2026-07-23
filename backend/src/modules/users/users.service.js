// src/modules/users/users.service.js

import { NotFoundError } from '../../errors/NotFoundError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';

import {
  getPagination,
  buildPagination,
} from '../../utils/pagination.js';

import {
  hashPassword,
  verifyPassword,
} from '../../utils/password.js';

import { AuditService } from '../audit/audit.service.js';

import {
  AUDIT_ACTION,
} from '../../utils/constants.js';

export class UsersService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.auditService = new AuditService(fastify);
  }

  /**
   * Get current user.
   */
  async getCurrentUser(userId) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      throw new NotFoundError(
        'User not found.'
      );
    }

    return user;
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          username: true,
          status: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundError(
        'User not found.'
      );
    }

    return user;
  }

  /**
   * Get user by username.
   */
  async getUserByUsername(username) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          username,
        },

        select: {
          id: true,
          username: true,
          status: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundError(
        'User not found.'
      );
    }

    return user;
  }

  /**
   * Update profile.
   */
  async updateProfile(userId, data) {
    const username =
      data.username?.trim();

    if (!username) {
      throw new ValidationError(
        'Username is required.'
      );
    }

    const current =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!current) {
      throw new NotFoundError(
        'User not found.'
      );
    }

    if (current.username === username) {
      return {
        id: current.id,
        username: current.username,
        email: current.email,
        updatedAt: current.updatedAt,
      };
    }

    const existing =
      await this.prisma.user.findFirst({
        where: {
          username,

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

    const user =
      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          username,
        },

        select: {
          id: true,
          username: true,
          email: true,
          updatedAt: true,
        },
      });

    await this.auditService.log({
      userId,
      action:
        AUDIT_ACTION.PROFILE_UPDATED,
    });

    return user;
  }

  /**
   * Change password.
   */
  async changePassword(
    userId,
    currentPassword,
    newPassword
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundError(
        'User not found.'
      );
    }

    const valid =
      await verifyPassword(
        currentPassword,
        user.passwordHash
      );

    if (!valid) {
      throw new AuthenticationError(
        'Current password is incorrect.'
      );
    }

    const passwordHash =
      await hashPassword(newPassword);

    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        passwordHash,
      },
    });

    await this.auditService.log({
      userId,
      action:
        AUDIT_ACTION.PASSWORD_CHANGED,
    });

    return {
      message:
        'Password changed successfully.',
    };
  }

  /**
   * Search users.
   */
  async searchUsers(
    currentUserId,
    query,
    page,
    limit
  ) {
    const pagination =
      getPagination(page, limit);

    const where = {
      username: {
        contains: query,
        mode: 'insensitive',
      },

      NOT: {
        id: currentUserId,
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
            status: true,
          },
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

    return {
      users,

      pagination:
        buildPagination(
          pagination.page,
          pagination.limit,
          total
        ),
    };
  }
}