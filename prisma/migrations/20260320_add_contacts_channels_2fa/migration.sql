-- KiNGChat v2.4 Migration: Contacts, Channels, 2FA
-- Adds: Contact model, Group enhancements, TOTP 2FA fields

-- ═══════════════════════════════════════════════════════
-- 1. Add 2FA (TOTP) columns to User table
-- ═══════════════════════════════════════════════════════
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════
-- 2. Create Contact table for user contacts
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Contact_ownerId_contactId_key" ON "Contact"("ownerId", "contactId");
CREATE INDEX IF NOT EXISTS "Contact_ownerId_idx" ON "Contact"("ownerId");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 3. Enhance Group table for channels
-- ═══════════════════════════════════════════════════════
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'GROUP';
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "inviteLink" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Group_inviteLink_key" ON "Group"("inviteLink");
CREATE INDEX IF NOT EXISTS "Group_type_idx" ON "Group"("type");
CREATE INDEX IF NOT EXISTS "Group_inviteLink_idx" ON "Group"("inviteLink");

-- ═══════════════════════════════════════════════════════
-- 4. Enhance GroupMember table
-- ═══════════════════════════════════════════════════════
ALTER TABLE "GroupMember" ADD COLUMN IF NOT EXISTS "isMuted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GroupMember" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update role constraint to include OWNER
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_role_check";
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_role_check"
    CHECK ("role" IN ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'));

CREATE INDEX IF NOT EXISTS "GroupMember_userId_idx" ON "GroupMember"("userId");
