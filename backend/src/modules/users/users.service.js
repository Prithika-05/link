// src/modules/users/users.service.js
import {
  NotFoundError,
  ValidationError,
  AuthenticationError,
} from "../../error.js";

import { getPagination, buildPagination } from "../../utils/pagination.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { AuditService } from "../audit/audit.service.js";
import { AUDIT_ACTION } from "../../utils/constants.js";

import { eq, ne, ilike, and, or, count, asc } from "drizzle-orm";
import { users } from "../../db/schema.js";

export class UsersService {
  constructor(fastify) {
    this.db = fastify.db;
    this.auditService = new AuditService(fastify);
  }

  /**
   * Get current user profile.
   */
  async getCurrentUser(userId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        publicId: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  /**
   * Get public user profile by ID.
   */
  async getUserById(userId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        publicId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  /**
   * Get public user profile by publicId (with latest public key).
   */
  async getUserByPublicId(publicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, publicId),
      columns: {
        publicId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
      with: {
        publicKeys: {
          limit: 1,
          orderBy: (publicKeys, { desc }) => [desc(publicKeys.createdAt)],
          columns: {
            fingerprint: true,
            algorithm: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  /**
   * Get user by username.
   */
  async getUserByUsername(username) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        publicId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  /**
   * Update profile.
   */
  async updateProfile(userId, data) {
    const username = data.username?.trim();
    const displayName = data.displayName?.trim();
    const avatarUrl = data.avatarUrl?.trim();

    const current = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!current) {
      throw new NotFoundError("User not found.");
    }

    if (username && username !== current.username) {
      const existing = await this.db.query.users.findFirst({
        where: and(eq(users.username, username), ne(users.id, userId)),
      });

      if (existing) {
        throw new ValidationError("Username is already in use.");
      }
    }

    const [updatedUser] = await this.db
      .update(users)
      .set({
        ...(username && { username }),
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      })
      .where(eq(users.id, userId))
      .returning({
        publicId: users.publicId,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt,
      });

    await this.auditService.log({
      userId,
      action: AUDIT_ACTION.PROFILE_UPDATED,
    });

    return updatedUser;
  }

  /**
   * Change password.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);

    if (!valid) {
      throw new AuthenticationError("Current password is incorrect.");
    }

    const passwordHash = await hashPassword(newPassword);

    await this.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    await this.auditService.log({
      userId,
      action: AUDIT_ACTION.PASSWORD_CHANGED,
    });

    return {
      message: "Password changed successfully.",
    };
  }

  /**
   * Search users strictly by username OR email.
   * Excluding non-unique displayName as per requirements.
   */
  async searchUsers(currentUserId, query, page, limit) {
    const pagination = getPagination(page, limit);

    const searchCondition = and(
      or(ilike(users.username, `%${query}%`), ilike(users.email, `%${query}%`)),
      ne(users.id, currentUserId),
    );

    const [usersList, [{ total }]] = await Promise.all([
      this.db.query.users.findMany({
        where: searchCondition,
        offset: pagination.skip,
        limit: pagination.limit,
        orderBy: [asc(users.username)],
        columns: {
          publicId: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          status: true,
        },
      }),

      this.db.select({ total: count() }).from(users).where(searchCondition),
    ]);

    return {
      users: usersList,
      pagination: buildPagination(
        pagination.page,
        pagination.limit,
        Number(total),
      ),
    };
  }
}
