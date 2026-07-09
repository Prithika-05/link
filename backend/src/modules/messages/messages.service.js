// src/modules/messages/messages.service.js

export class MessageService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
  }

  async send(senderId, data) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        ciphertext: data.ciphertext,
        iv: data.iv,
        authTag: data.authTag,
        ephemeralPublicKey: data.ephemeralPublicKey,
      },
    });

    return {
      success: true,
      messageId: message.id,
    };
  }

  async conversation(userA, userB, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [messages, total] = await this.prisma.$transaction([
    this.prisma.message.findMany({
      where: {
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

      orderBy: {
        createdAt: 'desc',
      },

      skip,

      take: limit,
    }),

    this.prisma.message.count({
      where: {
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
      },
    }),
  ]);

  return {
    success: true,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
    },

    messages: messages.reverse(),
  };
}

  async markDelivered(messageId) {
    const message = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        status: 'DELIVERED',
      },
    });

    return message;
  }
}