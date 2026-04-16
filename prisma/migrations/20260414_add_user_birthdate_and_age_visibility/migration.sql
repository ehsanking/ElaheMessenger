-- Add user birth-date storage and age visibility preference
ALTER TABLE "User"
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "showAge" BOOLEAN NOT NULL DEFAULT false;
