import { authenticate } from "../../middlewares/auth.middleware.js";
import { KeysController } from "./keys.controller.js";
import {
  uploadKeySchema,
  getKeySchema,
  listKeysSchema,
  deleteKeySchema,
  uploadBackupSchema,
  getBackupSchema,
} from "./keys.schema.js";

export default async function keysRoutes(fastify) {
  const controller = new KeysController(fastify);

  /* Existing routes */
  fastify.post(
    "/",
    {
      preHandler: [authenticate],
      schema: uploadKeySchema,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    controller.upload,
  );

  fastify.get(
    "/me",
    {
      preHandler: [authenticate],
      schema: listKeysSchema,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    controller.list,
  );

  fastify.delete(
    "/me",
    {
      preHandler: [authenticate],
      schema: deleteKeySchema,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    controller.delete,
  );

  // KEY BACKUP ROUTES
  fastify.post(
    "/backup",
    {
      preHandler: [authenticate],
      schema: uploadBackupSchema,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    controller.uploadBackup,
  );

  fastify.get(
    "/backup/me",
    {
      preHandler: [authenticate],
      schema: getBackupSchema,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    controller.getBackup,
  );

  fastify.get(
    "/:publicId",
    {
      preHandler: [authenticate],
      schema: getKeySchema,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    controller.get,
  );
}
