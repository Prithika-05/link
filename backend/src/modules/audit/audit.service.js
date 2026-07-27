import { auditLogs } from "../../db/schema.js";

export class AuditService {
  /**
   * @param {import('fastify').FastifyInstance} fastify
   */
  constructor(fastify) {
    this.db = fastify.db;
    this.logger = fastify.log;
  }

  /**
   * Write an audit log.
   *
   * If a Drizzle transaction client (tx) is supplied via the `db` parameter,
   * the log is written within that transaction. Otherwise, the global
   * database instance is used.
   *
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.action
   * @param {string|null} [params.ipAddress]
   * @param {string|null} [params.userAgent]
   * @param {Object} [params.db] - Optional Drizzle transaction instance
   */
  async log({
    userId,
    action,
    ipAddress = null,
    userAgent = null,
    db = this.db,
  }) {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error(
        {
          error,
          action,
          userId,
        },
        "Failed to write audit log.",
      );
    }
  }
}
