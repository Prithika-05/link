/*
  Warnings:

  - You are about to drop the column `recipientId` on the `Message` table. All the data in the column will be lost.
  - The `status` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `githubKeyUrl` on the `PublicKey` table. All the data in the column will be lost.
  - You are about to drop the column `keyFingerprint` on the `PublicKey` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PublicKey` table. All the data in the column will be lost.
  - You are about to drop the column `jti` on the `RevokedToken` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fingerprint]` on the table `PublicKey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenId]` on the table `RevokedToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `algorithm` to the `PublicKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fingerprint` to the `PublicKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `PublicKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenId` to the `RevokedToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'OFFLINE', 'AWAY');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "PublicKey" DROP CONSTRAINT "PublicKey_userId_fkey";

-- DropIndex
DROP INDEX "PublicKey_userId_key";

-- DropIndex
DROP INDEX "RevokedToken_jti_key";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "ipAddress" DROP NOT NULL,
ALTER COLUMN "userAgent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "recipientId",
ADD COLUMN     "receiverId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "PublicKey" DROP COLUMN "githubKeyUrl",
DROP COLUMN "keyFingerprint",
DROP COLUMN "updatedAt",
ADD COLUMN     "algorithm" TEXT NOT NULL,
ADD COLUMN     "fingerprint" TEXT NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RevokedToken" DROP COLUMN "jti",
ADD COLUMN     "tokenId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
DROP COLUMN "role",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE';

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicKey_fingerprint_key" ON "PublicKey"("fingerprint");

-- CreateIndex
CREATE INDEX "PublicKey_userId_idx" ON "PublicKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_tokenId_key" ON "RevokedToken"("tokenId");

-- AddForeignKey
ALTER TABLE "PublicKey" ADD CONSTRAINT "PublicKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
