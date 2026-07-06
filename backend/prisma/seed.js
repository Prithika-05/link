import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const alice = await prisma.user.upsert({
    where: {
      email: "alice@example.com",
    },
    update: {},
    create: {
      username: "alice",
      email: "alice@example.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: {
      email: "bob@example.com",
    },
    update: {},
    create: {
      username: "bob",
      email: "bob@example.com",
      passwordHash,
    },
  });

  await prisma.publicKey.upsert({
    where: {
      fingerprint: "alice-demo-fingerprint",
    },
    update: {},
    create: {
      userId: alice.id,
      algorithm: "ECDH-P256",
      key: "-----BEGIN PUBLIC KEY-----DEMO_ALICE_KEY-----END PUBLIC KEY-----",
      fingerprint: "alice-demo-fingerprint",
    },
  });

  await prisma.publicKey.upsert({
    where: {
      fingerprint: "bob-demo-fingerprint",
    },
    update: {},
    create: {
      userId: bob.id,
      algorithm: "ECDH-P256",
      key: "-----BEGIN PUBLIC KEY-----DEMO_BOB_KEY-----END PUBLIC KEY-----",
      fingerprint: "bob-demo-fingerprint",
    },
  });

  console.log("✅ Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });