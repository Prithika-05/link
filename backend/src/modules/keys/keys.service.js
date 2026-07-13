// src/modules/keys/keys.service.js

import { generateFingerprint } from '../../utils/crypto.js';

import { NotFoundError } from '../../errors/NotFoundError.js';

import { AuditService } from '../audit/audit.service.js';
import { SecurityService } from '../security/security.service.js';

import {
  AUDIT_ACTION,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../../utils/constants.js';

export class KeysService {
  constructor(fastify) {
    this.prisma = fastify.prisma;

    this.auditService = new AuditService(fastify);

    this.securityService =
      new SecurityService(fastify);
  }

  /**
   * Upload or replace a user's public key.
   */
  async upload(userId, data) {
    return this.prisma.$transaction(
      async (tx) => {
        const user =
          await tx.user.findUnique({
            where: {
              id: userId,
            },
          });

        if (!user) {
          throw new NotFoundError(
            'User not found.'
          );
        }

        const fingerprint =
          generateFingerprint(data.key);

        const existingKey =
          await tx.publicKey.findFirst({
            where: {
              userId,
            },
          });

        /**
         * Update existing key.
         */
        if (existingKey) {
          if (
            existingKey.key === data.key &&
            existingKey.algorithm ===
              data.algorithm
          ) {
            return {
              id: existingKey.id,
              algorithm:
                existingKey.algorithm,
              key: existingKey.key,
              fingerprint:
                existingKey.fingerprint,
              createdAt:
                existingKey.createdAt,
              updatedAt:
                existingKey.updatedAt,
            };
          }

          const updatedKey =
            await tx.publicKey.update({
              where: {
                id: existingKey.id,
              },

              data: {
                algorithm:
                  data.algorithm,

                key: data.key,

                fingerprint,
              },
            });

          await this.auditService.log({
            userId,

            action:
              AUDIT_ACTION.PUBLIC_KEY_UPDATED,
          });

          await this.securityService.log({
            userId,

            event:
              SECURITY_EVENT.KEY_CHANGED,

            severity:
              SECURITY_SEVERITY.LOW,
          });

          return updatedKey;
        }

        /**
         * Create new key.
         */
        const createdKey =
          await tx.publicKey.create({
            data: {
              userId,

              algorithm:
                data.algorithm,

              key: data.key,

              fingerprint,
            },
          });

        await this.auditService.log({
          userId,

          action:
            AUDIT_ACTION.PUBLIC_KEY_CREATED,
        });

        return createdKey;
      }
    );
  }

  /**
   * Get one user's public key.
   */
  async get(userId) {
    const key =
      await this.prisma.publicKey.findFirst({
        where: {
          userId,
        },

        select: {
          id: true,

          algorithm: true,

          key: true,

          fingerprint: true,

          createdAt: true,

          updatedAt: true,
        },
      });

    if (!key) {
      throw new NotFoundError(
        'Public key not found.'
      );
    }

    return key;
  }

  /**
   * List public keys.
   *
   * Currently one key per user, but this
   * method supports future multi-device keys.
   */
  async list(userId) {
    return this.prisma.publicKey.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,

        algorithm: true,

        fingerprint: true,

        createdAt: true,

        updatedAt: true,
      },
    });
  }

  /**
   * Delete public key.
   */
  async delete(userId) {
    const key =
      await this.prisma.publicKey.findFirst({
        where: {
          userId,
        },
      });

    if (!key) {
      throw new NotFoundError(
        'Public key not found.'
      );
    }

    await this.prisma.publicKey.delete({
      where: {
        id: key.id,
      },
    });

    await this.auditService.log({
      userId,

      action:
        AUDIT_ACTION.PUBLIC_KEY_DELETED,
    });

    await this.securityService.log({
      userId,

      event:
        SECURITY_EVENT.KEY_CHANGED,

      severity:
        SECURITY_SEVERITY.MEDIUM,
    });

    return {
      message:
        'Public key deleted successfully.',
    };
  }
}