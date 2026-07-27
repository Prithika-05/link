CREATE TYPE "public"."MessageStatus" AS ENUM('SENT', 'DELIVERED', 'READ', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."MessageType" AS ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."UserStatus" AS ENUM('ONLINE', 'OFFLINE', 'AWAY');--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"action" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeviceSession" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"refreshTokenId" text NOT NULL,
	"deviceName" text,
	"platform" text,
	"browser" text,
	"ipAddress" text,
	"userAgent" text,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "DeviceSession_refreshTokenId_unique" UNIQUE("refreshTokenId")
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"senderId" text NOT NULL,
	"receiverId" text NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"authTag" text NOT NULL,
	"ephemeralPublicKey" text NOT NULL,
	"status" "MessageStatus" DEFAULT 'SENT' NOT NULL,
	"type" "MessageType" DEFAULT 'TEXT' NOT NULL,
	"deliveredAt" timestamp,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PublicKey" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"algorithm" text NOT NULL,
	"key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PublicKey_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "RefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenId" text NOT NULL,
	"userId" text NOT NULL,
	"parentId" text,
	"expiresAt" timestamp NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RefreshToken_tokenId_unique" UNIQUE("tokenId")
);
--> statement-breakpoint
CREATE TABLE "RevokedToken" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RevokedToken_tokenId_unique" UNIQUE("tokenId")
);
--> statement-breakpoint
CREATE TABLE "SecurityEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"event" text NOT NULL,
	"severity" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"username" varchar(255) NOT NULL,
	"displayName" varchar(255),
	"email" varchar(255) NOT NULL,
	"passwordHash" text NOT NULL,
	"avatarUrl" text,
	"status" "UserStatus" DEFAULT 'OFFLINE' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_publicId_unique" UNIQUE("publicId"),
	CONSTRAINT "User_username_unique" UNIQUE("username"),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_refreshTokenId_RefreshToken_id_fk" FOREIGN KEY ("refreshTokenId") REFERENCES "public"."RefreshToken"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublicKey" ADD CONSTRAINT "PublicKey_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."RefreshToken"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "DeviceSession_userId_idx" ON "DeviceSession" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "DeviceSession_lastSeenAt_idx" ON "DeviceSession" USING btree ("lastSeenAt");--> statement-breakpoint
CREATE INDEX "Message_senderId_idx" ON "Message" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "Message_receiverId_idx" ON "Message" USING btree ("receiverId");--> statement-breakpoint
CREATE INDEX "Message_createdAt_idx" ON "Message" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Message_conversation_idx" ON "Message" USING btree ("senderId","receiverId","createdAt");--> statement-breakpoint
CREATE INDEX "PublicKey_userId_idx" ON "PublicKey" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "RefreshToken_parentId_idx" ON "RefreshToken" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent" USING btree ("createdAt");