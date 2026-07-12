// src/modules/messages/messages.service.js

import { NotFoundError } from '../../errors/NotFoundError.js';

import {
  getPagination,
  buildPagination,
} from '../../utils/pagination.js';

import {
  AUDIT_ACTION,
  MESSAGE_STATUS,
} from '../../utils/constants.js';

import { AuditService } from '../audit/audit.service.js';

export class MessageService {
  constructor(fastify) {
    this.prisma = fastify.prisma;

    this.auditService = new AuditService(fastify);
  }

  async send(senderId, data) {
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
        userId: senderId,

        action: AUDIT_ACTION.MESSAGE_SENT,
      });

      return message;
    });
  }

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

  async markDelivered(messageId) {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        status:
          MESSAGE_STATUS.DELIVERED,
      },
    });
  }

  async markRead(messageId) {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        status:
          MESSAGE_STATUS.READ,
      },
    });
  }
}