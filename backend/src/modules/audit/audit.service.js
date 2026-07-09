// src/modules/audit/audit.service.js

export class AuditService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
  }

  async log({
    userId,
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
      console.error('Audit log failed:', error);
    }
  }
}