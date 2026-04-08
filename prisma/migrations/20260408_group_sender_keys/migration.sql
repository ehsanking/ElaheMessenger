-- Group Sender Keys protocol persistence
ALTER TABLE "Group" ADD COLUMN "e2eeEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "GroupSenderKey" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "chainKey" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "keyGeneration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupSenderKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupSenderKeyDistribution" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "wrappedKey" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "keyGeneration" INTEGER NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSenderKeyDistribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupSenderKey_groupId_userId_deviceId_key" ON "GroupSenderKey"("groupId", "userId", "deviceId");
CREATE INDEX "GroupSenderKey_groupId_keyGeneration_idx" ON "GroupSenderKey"("groupId", "keyGeneration");
CREATE INDEX "GroupSenderKeyDistribution_recipientUserId_consumed_idx" ON "GroupSenderKeyDistribution"("recipientUserId", "consumed");
CREATE INDEX "GroupSenderKeyDistribution_groupId_senderUserId_keyGeneration_idx" ON "GroupSenderKeyDistribution"("groupId", "senderUserId", "keyGeneration");

ALTER TABLE "GroupSenderKey" ADD CONSTRAINT "GroupSenderKey_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupSenderKey" ADD CONSTRAINT "GroupSenderKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
