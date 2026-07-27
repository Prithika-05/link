// src/modules/messages/messages.service.js
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "../../error.js";

import { getPagination, buildPagination } from "../../utils/pagination.js";
import {
  AUDIT_ACTION,
  MESSAGE_STATUS,
  REDIS_PREFIX,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from "../../utils/constants.js";

import { AuditService } from "../audit/audit.service.js";
import { SecurityService } from "../security/security.service.js";

import { eq, or, and, desc, count } from "drizzle-orm";
import { users, publicKeys, messages } from "../../db/schema.js";

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REPLAY_TTL_SECONDS = 5 * 60;

export class MessageService {
  constructor(fastify) {
    this.db = fastify.db;
    this.redis = fastify.redis;

    this.auditService = new AuditService(fastify);
    this.securityService = new SecurityService(fastify);
  }

  /**
   * Validate replay protection.
   */
  async validateReplayProtection(data) {
    const now = Date.now();

    if (Math.abs(now - data.timestamp) > REPLAY_WINDOW_MS) {
      await this.securityService.log({
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: "Timestamp expired",
          timestamp: data.timestamp,
        },
      });

      throw new ValidationError("Message timestamp is invalid.");
    }

    const messageKey = `${REDIS_PREFIX.REPLAY}message:${data.messageId}`;
    const nonceKey = `${REDIS_PREFIX.REPLAY}nonce:${data.nonce}`;

    const messageExists = await this.redis.exists(messageKey);

    if (messageExists) {
      await this.securityService.log({
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: "Duplicate messageId",
          messageId: data.messageId,
        },
      });

      throw new ValidationError("Duplicate message detected.");
    }

    const nonceExists = await this.redis.exists(nonceKey);

    if (nonceExists) {
      await this.securityService.log({
        event: SECURITY_EVENT.REPLAY_ATTACK,
        severity: SECURITY_SEVERITY.HIGH,
        metadata: {
          reason: "Duplicate nonce",
          nonce: data.nonce,
        },
      });

      throw new ValidationError("Duplicate nonce detected.");
    }

    await this.redis.set(messageKey, "1", "EX", REPLAY_TTL_SECONDS);
    await this.redis.set(nonceKey, "1", "EX", REPLAY_TTL_SECONDS);
  }

  /**
   * Send an encrypted message.
   */
  async send(senderPublicId, data) {
    await this.validateReplayProtection(senderPublicId, data);

    const sender = await this.db.query.users.findFirst({
      where: eq(users.publicId, senderPublicId),
      columns: {
        id: true,
        publicId: true,
      },
    });

    if (!sender) {
      throw new NotFoundError("Sender not found.");
    }

    return this.db.transaction(async (tx) => {
      const receiver = await tx.query.users.findFirst({
        where: eq(users.publicId, data.receiverPublicId),
        columns: {
          id: true,
          publicId: true,
          username: true,
        },
      });

      if (!receiver) {
        throw new NotFoundError("Receiver not found.");
      }

      const publicKey = await tx.query.publicKeys.findFirst({
        where: eq(publicKeys.userId, receiver.id),
      });

      if (!publicKey) {
        throw new NotFoundError("Receiver has not uploaded a public key.");
      }

      const [message] = await tx
        .insert(messages)
        .values({
          senderId: sender.id,
          receiverId: receiver.id,

          ciphertext: data.ciphertext,
          iv: data.iv,
          authTag: data.authTag,
          ephemeralPublicKey: data.ephemeralPublicKey,

          status: MESSAGE_STATUS.SENT,
        })
        .returning();

      await this.auditService.log({
        userId: sender.id,
        action: AUDIT_ACTION.MESSAGE_SENT,
      });

      return {
        id: message.id,

        senderPublicId: sender.publicId,
        receiverPublicId: receiver.publicId,

        ciphertext: message.ciphertext,
        iv: message.iv,
        authTag: message.authTag,
        ephemeralPublicKey: message.ephemeralPublicKey,

        type: message.type,
        status: message.status,
        createdAt: message.createdAt,
      };
    });
  }

  /**
   * Retrieve conversation history.
   */
  async conversation(userA, userB, page = 1, limit = 50) {
    const pagination = getPagination(page, limit);

    const [sender, receiver] = await Promise.all([
      this.db.query.users.findFirst({
        where: eq(users.publicId, userA),
        columns: { id: true },
      }),
      this.db.query.users.findFirst({
        where: eq(users.publicId, userB),
        columns: { id: true },
      }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundError("User not found.");
    }

    const conversationCondition = or(
      and(
        eq(messages.senderId, sender.id),
        eq(messages.receiverId, receiver.id),
      ),
      and(
        eq(messages.senderId, receiver.id),
        eq(messages.receiverId, sender.id),
      ),
    );

    const [messagesList, [{ total }]] = await Promise.all([
      this.db.query.messages.findMany({
        where: conversationCondition,
        offset: pagination.skip,
        limit: pagination.limit,
        orderBy: [desc(messages.createdAt)],
        with: {
          sender: { columns: { publicId: true, username: true } },
          receiver: { columns: { publicId: true, username: true } },
        },
      }),

      this.db
        .select({ total: count() })
        .from(messages)
        .where(conversationCondition),
    ]);

    return {
      messages: messagesList.reverse().map((message) => ({
        id: message.id,

        senderPublicId: message.sender.publicId,
        receiverPublicId: message.receiver.publicId,

        ciphertext: message.ciphertext,
        iv: message.iv,
        authTag: message.authTag,
        ephemeralPublicKey: message.ephemeralPublicKey,

        status: message.status,
        type: message.type,
        createdAt: message.createdAt,
      })),

      pagination: buildPagination(
        pagination.page,
        pagination.limit,
        Number(total),
      ),
    };
  }

  /**
   * Mark message as delivered.
   */
  async markDelivered(messageId, userPublicId) {
    const message = await this.db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (!message) {
      throw new NotFoundError("Message not found.");
    }

    if (message.receiverId !== user.id) {
      throw new AuthorizationError(
        "You are not authorized to update this message.",
      );
    }

    const [updated] = await this.db
      .update(messages)
      .set({
        status: MESSAGE_STATUS.DELIVERED,
        deliveredAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }

  /**
   * Mark message as read.
   */
  async markRead(messageId, userPublicId) {
    const message = await this.db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (!message) {
      throw new NotFoundError("Message not found.");
    }

    if (message.receiverId !== user.id) {
      throw new AuthorizationError(
        "You are not authorized to update this message.",
      );
    }

    const [updated] = await this.db
      .update(messages)
      .set({
        status: MESSAGE_STATUS.READ,
        readAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }
}
