// src/modules/keys/keys.service.js

export class KeysService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
  }

  async upload(userId, data) {
    const existingKey = await this.prisma.publicKey.findFirst({
      where: {
        userId,
      },
    });

    if (existingKey) {
      await this.prisma.publicKey.update({
        where: {
          id: existingKey.id,
        },
        data,
      });
      console.log("Upload userId:", userId);
      return {
        success: true,
        message: 'Public key updated successfully.',
      };
    }

    await this.prisma.publicKey.create({
      data: {
        userId,
        ...data,
      },
    });

    return {
      success: true,
      message: 'Public key uploaded successfully.',
    };
  }

  async get(userId) {
  console.log("Get userId:", userId);

  const key = await this.prisma.publicKey.findFirst({
    where: {
      userId,
    },
    select: {
      algorithm: true,
      key: true,
      fingerprint: true,
      createdAt: true,
    },
  });

  console.log("Key:", key);

  if (!key) {
    const error = new Error("Public key not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    publicKey: key,
  };
}
}