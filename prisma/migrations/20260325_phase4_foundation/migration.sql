-- Phase 4 foundation: messaging maturity fields
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Message_senderId_idempotencyKey_key"
  ON "Message"("senderId", "idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Message_recipientId_deliveryStatus_createdAt_idx"
  ON "Message"("recipientId", "deliveryStatus", "createdAt");

CREATE INDEX IF NOT EXISTS "Message_groupId_deliveryStatus_createdAt_idx"
  ON "Message"("groupId", "deliveryStatus", "createdAt");
