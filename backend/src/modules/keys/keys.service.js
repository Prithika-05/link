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

    this.securityService = new SecurityService(fastify);
  }

  /**
   * Upload or replace a user's public key.
   *
   * @param {string} userId
   * @param {Object} data
   */
  async upload(userId, data) {
    return this.prisma.$transaction(async (tx) => {
      const fingerprint = generateFingerprint(data.key);

      const existingKey =
        await tx.publicKey.findFirst({
          where: {
            userId,
          },
        });

      if (existingKey) {
        const updatedKey =
          await tx.publicKey.update({
            where: {
              id: existingKey.id,
            },

            data: {
              algorithm: data.algorithm,
              key: data.key,
              fingerprint,
            },
          });

        await this.auditService.log({
          userId,
          action: AUDIT_ACTION.PUBLIC_KEY_UPDATED,
        });

        await this.securityService.log({
          userId,

          event: SECURITY_EVENT.KEY_CHANGED,

          severity: SECURITY_SEVERITY.LOW,
        });

        return updatedKey;
      }

      const createdKey =
        await tx.publicKey.create({
          data: {
            userId,

            algorithm: data.algorithm,

            key: data.key,

            fingerprint,
          },
        });

      await this.auditService.log({
        userId,
        action: AUDIT_ACTION.PUBLIC_KEY_CREATED,
      });

      return createdKey;
    });
  }

  /**
   * Retrieve a user's public key.
   *
   * @param {string} userId
   */
  async get(userId) {
    const key =
      await this.prisma.publicKey.findFirst({
        where: {
          userId,
        },

        select: {
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
}