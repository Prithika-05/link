import fp from "fastify-plugin";
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

async function prismaPlugin(fastify) {
  await prisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.log.info("✅ Connected to PostgreSQL");

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
    fastify.log.info("📦 Prisma disconnected");
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
});