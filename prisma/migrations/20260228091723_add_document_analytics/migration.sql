-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "aiModelUsed" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "processingTimeMs" INTEGER;
