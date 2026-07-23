// src/modules/security/security.service.js

import { SECURITY_SEVERITY } from '../../utils/constants.js';

export class SecurityService {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.prisma = fastify.prisma;
    this.logger = fastify.log;
  }

  /**
   * Record a security event.
   *
   * @param {Object} data
   * @param {string|null} data.userId
   * @param {string} data.event
   * @param {string} [data.severity]
   * @param {string|null} [data.ipAddress]
   * @param {string|null} [data.userAgent]
   * @param {Object|null} [data.metadata]
   * @returns {Promise<void>}
   */
  async log({
    userId = null,
    event,
    severity = SECURITY_SEVERITY.LOW,
    ipAddress = null,
    userAgent = null,
    metadata = null,
  }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          event,
          severity,
          ipAddress,
          userAgent,
          metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        {
          error,
          userId,
          event,
          severity,
        },
        'Failed to write security event.'
      );
    }
  }
}