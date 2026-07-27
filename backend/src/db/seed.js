import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcrypt";
import * as schema from "./schema.js";
import { users, publicKeys } from "./schema.js";
import { env } from "../config/env.js";

const queryClient = postgres(env.databaseUrl);
const db = drizzle(queryClient, { schema });

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const [alice] = await db
    .insert(users)
    .values({
      username: "alice",
      displayName: "Alice",
      email: "alice@example.com",
      passwordHash,
    })
    .onConflictDoNothing()
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      username: "bob",
      displayName: "Bob",
      email: "bob@example.com",
      passwordHash,
    })
    .onConflictDoNothing()
    .returning();

  if (alice) {
    await db
      .insert(publicKeys)
      .values({
        userId: alice.id,
        algorithm: "ECDH-P256",
        key: "-----BEGIN PUBLIC KEY-----DEMO_ALICE_KEY-----END PUBLIC KEY-----",
        fingerprint: "alice-demo-fingerprint",
      })
      .onConflictDoNothing();
  }

  if (bob) {
    await db
      .insert(publicKeys)
      .values({
        userId: bob.id,
        algorithm: "ECDH-P256",
        key: "-----BEGIN PUBLIC KEY-----DEMO_BOB_KEY-----END PUBLIC KEY-----",
        fingerprint: "bob-demo-fingerprint",
      })
      .onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully.");
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
