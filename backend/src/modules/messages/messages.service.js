// src/modules/messages/messages.service.js

import { NotFoundError } from '../../errors/NotFoundError.js';
import { ValidationError } from '../../errors/ValidationError.js';

import {
  getPagination,
  buildPagination,
} from '../../utils/pagination.js';

import {
  AUDIT_ACTION,
  MESSAGE_STATUS,
  REDIS_PREFIX,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from '../../utils/constants.js';

import { AuditService } from '../audit/audit.service.js';
import { SecurityService } from '../security/security.service.js';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REPLAY_TTL_SECONDS = 5 * 60;

export class MessageService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.redis = fastify.redis;

    this.auditService = new AuditService(fastify);
    this.securityService = new SecurityService(fastify);
  }

  /**
   * Validate replay protection.
   */
  async validateReplayProtection(senderId, data) {
    const now = Date.now();

    if (
      Math.abs(now - data.timestamp) >
      REPLAY_WINDOW_MS
    ) {
      await this.securityService.log({
        userId: senderId,
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: 'Timestamp expired',
          timestamp: data.timestamp,
        },
      });

      throw new ValidationError(
        'Message timestamp is invalid.'
      );
    }

    const messageKey =
      `${REDIS_PREFIX.REPLAY}message:${data.messageId}`;

    const nonceKey =
      `${REDIS_PREFIX.REPLAY}nonce:${data.nonce}`;

    const messageExists =
      await this.redis.exists(messageKey);

    if (messageExists) {
      await this.securityService.log({
        userId: senderId,
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: 'Duplicate messageId',
          messageId: data.messageId,
        },
      });

      throw new ValidationError(
        'Duplicate message detected.'
      );
    }

    const nonceExists =
      await this.redis.exists(nonceKey);

    if (nonceExists) {
      await this.securityService.log({
        userId: senderId,
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: 'Duplicate nonce',
          nonce: data.nonce,
        },
      });

      throw new ValidationError(
        'Duplicate nonce detected.'
      );
    }

    await this.redis.set(
      messageKey,
      '1',
      'EX',
      REPLAY_TTL_SECONDS
    );

    await this.redis.set(
      nonceKey,
      '1',
      'EX',
      REPLAY_TTL_SECONDS
    );
  }

  /**
   * Send an encrypted message.
   */
  async send(senderId, data) {
    await this.validateReplayProtection(
      senderId,
      data
    );

    return this.prisma.$transaction(async (tx) => {
      const receiver =
        await tx.user.findUnique({
          where: {
            id: data.receiverId,
          },
        });

      if (!receiver) {
        throw new NotFoundError(
          'Receiver not found.'
        );
      }

      const publicKey =
        await tx.publicKey.findFirst({
          where: {
            userId: data.receiverId,
          },
        });

      if (!publicKey) {
        throw new NotFoundError(
          'Receiver has not uploaded a public key.'
        );
      }

      const message =
        await tx.message.create({
          data: {
            senderId,
            receiverId: data.receiverId,

            ciphertext: data.ciphertext,
            iv: data.iv,
            authTag: data.authTag,
            ephemeralPublicKey:
              data.ephemeralPublicKey,

            status: MESSAGE_STATUS.SENT,
          },
        });

      await this.auditService.log({
        prisma: tx,
        userId: senderId,
        action: AUDIT_ACTION.MESSAGE_SENT,
      });

      return message;
    });
  }

  /**
   * Retrieve conversation.
   */
  async conversation(
    userA,
    userB,
    page = 1,
    limit = 50
  ) {
    const pagination =
      getPagination(page, limit);

    const where = {
      OR: [
        {
          senderId: userA,
          receiverId: userB,
        },
        {
          senderId: userB,
          receiverId: userA,
        },
      ],
    };

    const [messages, total] =
      await this.prisma.$transaction([
        this.prisma.message.findMany({
          where,

          skip: pagination.skip,

          take: pagination.limit,

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            senderId: true,
            receiverId: true,
            ciphertext: true,
            iv: true,
            authTag: true,
            ephemeralPublicKey: true,
            status: true,
            type: true,
            createdAt: true,
          },
        }),

        this.prisma.message.count({
          where,
        }),
      ]);

    return {
      messages: messages.reverse(),

      pagination: buildPagination(
        pagination.page,
        pagination.limit,
        total
      ),
    };
  }

  /**
   * Mark delivered.
   */
  async markDelivered(messageId) {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        status: MESSAGE_STATUS.DELIVERED,
      },
    });
  }

  /**
   * Mark read.
   */
  async markRead(messageId) {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        status: MESSAGE_STATUS.READ,
      },
    });
  }
}