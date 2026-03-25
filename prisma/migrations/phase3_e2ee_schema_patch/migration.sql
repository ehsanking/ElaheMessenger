-- Phase 3 E2EE schema patch
-- This migration adds the minimum fields needed to persist the runtime v2 verification bundle.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "signingPublicKey" TEXT,
ADD COLUMN IF NOT EXISTS "e2eeVersion" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "wrappedFileKey" TEXT,
ADD COLUMN IF NOT EXISTS "wrappedFileKeyNonce" TEXT,
ADD COLUMN IF NOT EXISTS "fileNonce" TEXT;

-- After rollout, v2 users should always publish a signingPublicKey.
-- Keep nullable during migration to avoid breaking existing legacy accounts.

CREATE INDEX IF NOT EXISTS "User_e2eeVersion_idx" ON "User"("e2eeVersion");
CREATE INDEX IF NOT EXISTS "Message_groupId_createdAt_idx" ON "Message"("groupId", "createdAt");
