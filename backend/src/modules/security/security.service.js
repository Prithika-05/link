import { SECURITY_SEVERITY } from "../../utils/constants.js";
import { securityEvents } from "../../db/schema.js";

export class SecurityService {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.db = fastify.db;
    this.logger = fastify.log;
  }

  /**
   * Record a security event.
   *
   * @param {Object} params
   * @param {string|null} [params.userId]
   * @param {string} params.event
   * @param {string} [params.severity]
   * @param {string|null} [params.ipAddress]
   * @param {string|null} [params.userAgent]
   * @param {Object|null} [params.metadata]
   * @param {Object} [params.db] - Optional Drizzle transaction instance
   * @returns {Promise<void>}
   */
  async log({
    userId = null,
    event,
    severity = SECURITY_SEVERITY.LOW,
    ipAddress = null,
    userAgent = null,
    metadata = null,
    db = this.db,
  }) {
    try {
      await db.insert(securityEvents).values({
        userId,
        event,
        severity,
        ipAddress,
        userAgent,
        metadata,
      });
    } catch (error) {
      this.logger.error(
        {
          error,
          userId,
          event,
          severity,
        },
        "Failed to write security event.",
      );
    }
  }
}
