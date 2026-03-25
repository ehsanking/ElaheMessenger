
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "replyToId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Message"
  ADD CONSTRAINT "Message_replyToId_fkey"
  FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Message_replyToId_idx" ON "Message"("replyToId");

CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
  ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId","userId","emoji");
CREATE INDEX IF NOT EXISTS "MessageReaction_messageId_createdAt_idx" ON "MessageReaction"("messageId","createdAt");
CREATE INDEX IF NOT EXISTS "MessageReaction_userId_createdAt_idx" ON "MessageReaction"("userId","createdAt");

CREATE TABLE IF NOT EXISTS "MessageDraft" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "conversationKey" TEXT NOT NULL,
  "recipientId" TEXT,
  "groupId" TEXT,
  "ciphertext" TEXT,
  "nonce" TEXT,
  "clientDraft" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
  ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "MessageDraft_userId_conversationKey_key" ON "MessageDraft"("userId","conversationKey");
CREATE INDEX IF NOT EXISTS "MessageDraft_userId_updatedAt_idx" ON "MessageDraft"("userId","updatedAt");
