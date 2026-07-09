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

  async conversation(userA, userB) {
    const messages = await this.prisma.message.findMany({
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

      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      success: true,
      messages,
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