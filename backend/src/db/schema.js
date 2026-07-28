import {
  pgTable,
  pgEnum,
  text,
  varchar,
  boolean,
  timestamp,
  json,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ==========================================
// ENUMS
// ==========================================
export const userStatusEnum = pgEnum("UserStatus", [
  "ONLINE",
  "OFFLINE",
  "AWAY",
]);
export const messageStatusEnum = pgEnum("MessageStatus", [
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
]);
export const messageTypeEnum = pgEnum("MessageType", [
  "TEXT",
  "IMAGE",
  "FILE",
  "SYSTEM",
]);
export const contactRequestStatusEnum = pgEnum("ContactRequestStatus", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);

// ==========================================
// TABLES
// ==========================================

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  publicId: text("publicId")
    .notNull()
    .unique()
    .$defaultFn(() => createId()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  avatarUrl: text("avatarUrl"), // OPTIONAL: Profile photo / avatar URL
  status: userStatusEnum("status").default("OFFLINE").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const publicKeys = pgTable(
  "PublicKey",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    algorithm: text("algorithm").notNull(),
    key: text("key").notNull(),
    fingerprint: text("fingerprint").notNull().unique(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("PublicKey_userId_idx").on(table.userId)],
);

export const messages = pgTable(
  "Message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    senderId: text("senderId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: text("receiverId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    authTag: text("authTag").notNull(),
    ephemeralPublicKey: text("ephemeralPublicKey").notNull(),
    status: messageStatusEnum("status").default("SENT").notNull(),
    type: messageTypeEnum("type").default("TEXT").notNull(),
    deliveredAt: timestamp("deliveredAt", { mode: "date" }), // OPTIONAL: Exact delivery timestamp
    readAt: timestamp("readAt", { mode: "date" }), // OPTIONAL: Exact read receipt timestamp
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("Message_senderId_idx").on(table.senderId),
    index("Message_receiverId_idx").on(table.receiverId),
    index("Message_createdAt_idx").on(table.createdAt),
    index("Message_conversation_idx").on(
      table.senderId,
      table.receiverId,
      table.createdAt,
    ),
  ],
);

export const refreshTokens = pgTable(
  "RefreshToken",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    tokenId: text("tokenId").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parentId"),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("RefreshToken_userId_idx").on(table.userId),
    index("RefreshToken_expiresAt_idx").on(table.expiresAt),
    index("RefreshToken_parentId_idx").on(table.parentId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "RefreshToken_parentId_fkey",
    }).onDelete("set null"),
  ],
);

export const keyBackups = pgTable("keyBackups", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  salt: text("salt").notNull(),
  iv: text("iv").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deviceSessions = pgTable(
  "DeviceSession",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenId: text("refreshTokenId")
      .notNull()
      .unique()
      .references(() => refreshTokens.id, { onDelete: "cascade" }),
    deviceName: text("deviceName"),
    platform: text("platform"),
    browser: text("browser"),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    lastSeenAt: timestamp("lastSeenAt", { mode: "date" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("DeviceSession_userId_idx").on(table.userId),
    index("DeviceSession_lastSeenAt_idx").on(table.lastSeenAt),
  ],
);

export const revokedTokens = pgTable(
  "RevokedToken",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    tokenId: text("tokenId").notNull().unique(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("RevokedToken_expiresAt_idx").on(table.expiresAt)],
);

export const auditLogs = pgTable(
  "AuditLog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("AuditLog_userId_idx").on(table.userId),
    index("AuditLog_createdAt_idx").on(table.createdAt),
  ],
);

export const securityEvents = pgTable(
  "SecurityEvent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    severity: text("severity").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("SecurityEvent_userId_idx").on(table.userId),
    index("SecurityEvent_createdAt_idx").on(table.createdAt),
  ],
);
export const contactRequests = pgTable(
  "ContactRequest",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    senderId: text("senderId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: text("receiverId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: contactRequestStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ContactRequest_senderId_idx").on(table.senderId),
    index("ContactRequest_receiverId_idx").on(table.receiverId),
    index("ContactRequest_unique_pair").on(table.senderId, table.receiverId),
  ],
);

// ==========================================
// RELATIONS
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  deviceSessions: many(deviceSessions),
  receivedMessages: many(messages, { relationName: "ReceivedMessages" }),
  sentMessages: many(messages, { relationName: "SentMessages" }),
  publicKeys: many(publicKeys),
  refreshTokens: many(refreshTokens),
  securityEvents: many(securityEvents),
  sentContactRequests: many(contactRequests, {
    relationName: "SentContactRequests",
  }),
  receivedContactRequests: many(contactRequests, {
    relationName: "ReceivedContactRequests",
  }),
}));

export const publicKeysRelations = relations(publicKeys, ({ one }) => ({
  user: one(users, {
    fields: [publicKeys.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "ReceivedMessages",
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "SentMessages",
  }),
}));

export const refreshTokensRelations = relations(
  refreshTokens,
  ({ one, many }) => ({
    user: one(users, {
      fields: [refreshTokens.userId],
      references: [users.id],
    }),
    parent: one(refreshTokens, {
      fields: [refreshTokens.parentId],
      references: [refreshTokens.id],
      relationName: "RefreshTokenLineage",
    }),
    children: many(refreshTokens, {
      relationName: "RefreshTokenLineage",
    }),
    deviceSession: one(deviceSessions),
  }),
);

export const deviceSessionsRelations = relations(deviceSessions, ({ one }) => ({
  user: one(users, {
    fields: [deviceSessions.userId],
    references: [users.id],
  }),
  refreshToken: one(refreshTokens, {
    fields: [deviceSessions.refreshTokenId],
    references: [refreshTokens.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}));

export const contactRequestsRelations = relations(
  contactRequests,
  ({ one }) => ({
    sender: one(users, {
      fields: [contactRequests.senderId],
      references: [users.id],
      relationName: "SentContactRequests",
    }),
    receiver: one(users, {
      fields: [contactRequests.receiverId],
      references: [users.id],
      relationName: "ReceivedContactRequests",
    }),
  }),
);
