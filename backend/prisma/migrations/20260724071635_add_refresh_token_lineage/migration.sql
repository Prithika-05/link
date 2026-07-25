-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "RefreshToken_parentId_idx" ON "RefreshToken"("parentId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
