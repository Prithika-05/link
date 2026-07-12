// src/modules/audit/audit.service.js

export class AuditService {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.log = fastify.log;
  }

  /**
   * Record an audit event.
   *
   * @param {Object} data
   * @param {string|null} data.userId
   * @param {string} data.action
   * @param {string|null} [data.ipAddress]
   * @param {string|null} [data.userAgent]
   * @returns {Promise<void>}
   */
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
      this.log.error(
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