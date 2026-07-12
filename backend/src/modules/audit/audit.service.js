// src/modules/audit/audit.service.js

export class AuditService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.logger = fastify.log;
  }

  async log({
    userId = null,
    action,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        {
          error,
          action,
          userId,
        },
        'Failed to write audit log.'
      );
    }
  }
}