-- Email provider configuration fields for AdminSettings.
-- Supports Brevo, Resend, Mailgun, SendGrid, Postmark, and custom SMTP.

ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailProvider"      TEXT    NOT NULL DEFAULT 'none';
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailFromAddress"   TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailFromName"      TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailApiKey"        TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailSmtpHost"      TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailSmtpPort"      INTEGER;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailSmtpSecure"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailSmtpUser"      TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailSmtpPass"      TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailMailgunDomain" TEXT;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "emailMailgunRegion" TEXT    NOT NULL DEFAULT 'us';
