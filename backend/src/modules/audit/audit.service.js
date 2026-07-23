// src/modules/audit/audit.service.js

export class AuditService {
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.logger = fastify.log;
  }

  /**
   * Write an audit log.
   *
   * If a Prisma transaction client is supplied, the audit log
   * is written using that transaction. Otherwise the global
   * Prisma client is used.
   */
  async log({
    userId = null,
    action,
    ipAddress = null,
    userAgent = null,
    prisma = this.prisma,
  }) {
    try {
      await prisma.auditLog.create({
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