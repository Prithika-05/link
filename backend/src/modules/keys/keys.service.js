import { generateFingerprint } from "../../utils/crypto.js";
import { NotFoundError } from "../../error.js";

import { AuditService } from "../audit/audit.service.js";
import { SecurityService } from "../security/security.service.js";

import {
  AUDIT_ACTION,
  SECURITY_EVENT,
  SECURITY_SEVERITY,
} from "../../utils/constants.js";

import { eq, desc, or } from "drizzle-orm";
import { users, publicKeys, keyBackups } from "../../db/schema.js";

export class KeysService {
  constructor(fastify) {
    this.db = fastify.db;
    this.auditService = new AuditService(fastify);
    this.securityService = new SecurityService(fastify);
  }

  /**
   * Upload or replace a user's public key.
   */
  async upload(userPublicId, data) {
    return this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.publicId, userPublicId),
      });

      if (!user) {
        throw new NotFoundError("User not found.");
      }

      const fingerprint = generateFingerprint(data.key);

      const existingKey = await tx.query.publicKeys.findFirst({
        where: eq(publicKeys.userId, user.id),
      });

      if (existingKey) {
        if (
          existingKey.key === data.key &&
          existingKey.algorithm === data.algorithm
        ) {
          return existingKey;
        }

        const [updatedKey] = await tx
          .update(publicKeys)
          .set({
            algorithm: data.algorithm,
            key: data.key,
            fingerprint,
          })
          .where(eq(publicKeys.id, existingKey.id))
          .returning();

        await this.auditService.log({
          userId: user.id,
          action: AUDIT_ACTION.PUBLIC_KEY_UPDATED,
        });

        await this.securityService.log({
          userId: user.id,
          event: SECURITY_EVENT.KEY_CHANGED,
          severity: SECURITY_SEVERITY.LOW,
        });

        return updatedKey;
      }

      const [createdKey] = await tx
        .insert(publicKeys)
        .values({
          userId: user.id,
          algorithm: data.algorithm,
          key: data.key,
          fingerprint,
        })
        .returning();

      await this.auditService.log({
        userId: user.id,
        action: AUDIT_ACTION.PUBLIC_KEY_CREATED,
      });

      return createdKey;
    });
  }

  /**
   * Get public key for any target user via publicId or username.
   */
  async get(identifier) {
    const user = await this.db.query.users.findFirst({
      where: or(eq(users.publicId, identifier), eq(users.username, identifier)),
      columns: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const key = await this.db.query.publicKeys.findFirst({
      where: eq(publicKeys.userId, user.id),
      columns: {
        id: true,
        algorithm: true,
        key: true,
        fingerprint: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!key) {
      throw new NotFoundError("Public key not found for user.");
    }

    return key;
  }

  /**
   * List public keys for authenticated user.
   */
  async list(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return this.db.query.publicKeys.findMany({
      where: eq(publicKeys.userId, user.id),
      orderBy: [desc(publicKeys.createdAt)],
      columns: {
        id: true,
        algorithm: true,
        fingerprint: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete public key.
   */
  async delete(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const key = await this.db.query.publicKeys.findFirst({
      where: eq(publicKeys.userId, user.id),
    });

    if (!key) {
      throw new NotFoundError("Public key not found.");
    }

    await this.db.delete(publicKeys).where(eq(publicKeys.id, key.id));

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTION.PUBLIC_KEY_DELETED,
    });

    await this.securityService.log({
      userId: user.id,
      event: SECURITY_EVENT.KEY_CHANGED,
      severity: SECURITY_SEVERITY.MEDIUM,
    });

    return {
      message: "Public key deleted successfully.",
    };
  }

  /**
   * Save or update user's encrypted private key backup.
   */
  async saveBackup(userPublicId, data) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    console.log(
      "Saving Key Backup. Received Encrypted Key Length:",
      data.encryptedPrivateKey?.length,
    );

    const existingBackup = await this.db.query.keyBackups.findFirst({
      where: eq(keyBackups.userId, user.id),
    });

    if (existingBackup) {
      const [updated] = await this.db
        .update(keyBackups)
        .set({
          encryptedPrivateKey: data.encryptedPrivateKey,
          salt: data.salt,
          iv: data.iv,
          fingerprint: data.fingerprint || null,
          updatedAt: new Date(),
        })
        .where(eq(keyBackups.id, existingBackup.id))
        .returning();

      return updated;
    }

    const [inserted] = await this.db
      .insert(keyBackups)
      .values({
        id: globalThis.crypto.randomUUID(),
        userId: user.id,
        encryptedPrivateKey: data.encryptedPrivateKey,
        salt: data.salt,
        iv: data.iv,
        fingerprint: data.fingerprint || null,
      })
      .returning();

    return inserted;
  }

  /**
   * Retrieve encrypted private key backup for authenticated user.
   */
  async getBackup(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const backup = await this.db.query.keyBackups.findFirst({
      where: eq(keyBackups.userId, user.id),
      columns: {
        encryptedPrivateKey: true,
        salt: true,
        iv: true,
        fingerprint: true,
      },
    });

    if (!backup) {
      throw new NotFoundError("No key backup found for this account.");
    }

    return backup;
  }
}
