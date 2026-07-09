// src/modules/security/security.service.js

export class SecurityService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
  }

  async log({
    userId,
    event,
    severity = 'LOW',
    ipAddress = null,
    metadata = null,
  }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          event,
          severity,
          ipAddress,
          metadata,
        },
      });
    } catch (error) {
      console.error(
        'Security event logging failed:',
        error
      );
    }
  }
}