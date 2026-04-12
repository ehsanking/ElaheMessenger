/**
 * Unified email service.
 *
 * Supported providers (configured via Admin Settings → Email Provider):
 *   brevo    – Brevo (formerly Sendinblue) Transactional Email API v3
 *   resend   – Resend API (SDK)
 *   mailgun  – Mailgun Messages API (SDK)
 *   sendgrid – SendGrid Mail API (SDK)
 *   postmark – Postmark Transactional Email API (SDK)
 *   smtp     – Custom SMTP via nodemailer
 *   none     – Email disabled
 *
 * Falls back to environment variables (SMTP_HOST, SMTP_USER, …) when
 * no provider is configured in the database, ensuring backwards
 * compatibility with installations that pre-date this feature.
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { ServerClient as PostmarkClient } from 'postmark';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { decryptSecret, isEncryptedSecret } from '@/lib/secret-encryption';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EmailProvider =
  | 'none'
  | 'smtp'
  | 'brevo'
  | 'resend'
  | 'mailgun'
  | 'sendgrid'
  | 'postmark';

export type EmailProviderConfig = {
  provider: EmailProvider;
  fromAddress: string;
  fromName?: string;
  // API-key-based providers (brevo, resend, sendgrid, postmark)
  apiKey?: string;
  // Mailgun extras
  mailgunDomain?: string;
  mailgunRegion?: 'us' | 'eu';
  // Custom SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Config loading
// ─────────────────────────────────────────────────────────────────────────────

function decryptIfNeeded(value: string | null | undefined): string {
  if (!value) return '';
  return isEncryptedSecret(value) ? (decryptSecret(value) ?? '') : value;
}

/**
 * Loads the email provider configuration from AdminSettings.
 * Returns null when no provider is configured.
 */
export async function loadEmailProviderConfig(): Promise<EmailProviderConfig | null> {
  try {
    const settings = await prisma.adminSettings.findUnique({ where: { id: '1' } });
    if (settings) {
      const s = settings as unknown as Record<string, unknown>;
      const provider = (typeof s.emailProvider === 'string' ? s.emailProvider : 'none') as EmailProvider;
      if (provider !== 'none') {
        const fromAddress = typeof s.emailFromAddress === 'string' ? s.emailFromAddress : '';
        if (!fromAddress) return null;
        return {
          provider,
          fromAddress,
          fromName: typeof s.emailFromName === 'string' ? s.emailFromName : undefined,
          apiKey: decryptIfNeeded(typeof s.emailApiKey === 'string' ? s.emailApiKey : null),
          mailgunDomain: typeof s.emailMailgunDomain === 'string' ? s.emailMailgunDomain : undefined,
          mailgunRegion: (s.emailMailgunRegion === 'eu' ? 'eu' : 'us'),
          smtpHost: typeof s.emailSmtpHost === 'string' ? s.emailSmtpHost : undefined,
          smtpPort: typeof s.emailSmtpPort === 'number' ? s.emailSmtpPort : undefined,
          smtpSecure: Boolean(s.emailSmtpSecure),
          smtpUser: typeof s.emailSmtpUser === 'string' ? s.emailSmtpUser : undefined,
          smtpPass: decryptIfNeeded(typeof s.emailSmtpPass === 'string' ? s.emailSmtpPass : null),
        };
      }
    }
  } catch (error) {
    logger.warn('Could not load email provider config from DB.', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fall back to environment variables for backwards compatibility
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  if (host && user && pass && from) {
    return {
      provider: 'smtp',
      fromAddress: from,
      smtpHost: host,
      smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
      smtpSecure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
      smtpUser: user,
      smtpPass: pass,
    };
  }

  return null;
}

/**
 * Synchronous check against pre-loaded AdminSettings record.
 * Use this inside server actions that have already fetched settings to
 * avoid an extra DB round-trip.
 */
export function isEmailConfiguredFromSettings(s: Record<string, unknown>): boolean {
  const provider = typeof s.emailProvider === 'string' ? s.emailProvider : 'none';
  if (provider !== 'none' && typeof s.emailFromAddress === 'string' && s.emailFromAddress) {
    return true;
  }
  // Also respect env-var SMTP as fallback
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim(),
  );
}

/**
 * Async check — loads config from DB.
 */
export async function isEmailConfigured(): Promise<boolean> {
  return (await loadEmailProviderConfig()) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider-specific send implementations
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaBrevo(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.apiKey) throw new Error('Brevo: apiKey is required.');
  const fromObj = cfg.fromName
    ? { name: cfg.fromName, email: cfg.fromAddress }
    : { email: cfg.fromAddress };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': cfg.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: fromObj,
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
}

async function sendViaResend(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.apiKey) throw new Error('Resend: apiKey is required.');
  const resend = new Resend(cfg.apiKey);
  const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromAddress}>` : cfg.fromAddress;
  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaMailgun(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.apiKey) throw new Error('Mailgun: apiKey is required.');
  if (!cfg.mailgunDomain) throw new Error('Mailgun: domain is required.');

  const mg = new Mailgun(FormData);
  const client = mg.client({
    username: 'api',
    key: cfg.apiKey,
    url: cfg.mailgunRegion === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
  });

  const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromAddress}>` : cfg.fromAddress;
  await client.messages.create(cfg.mailgunDomain, {
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

async function sendViaSendGrid(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.apiKey) throw new Error('SendGrid: apiKey is required.');
  sgMail.setApiKey(cfg.apiKey);
  const from = cfg.fromName
    ? { email: cfg.fromAddress, name: cfg.fromName }
    : cfg.fromAddress;
  await sgMail.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

async function sendViaPostmark(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.apiKey) throw new Error('Postmark: server token is required.');
  const client = new PostmarkClient(cfg.apiKey);
  const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromAddress}>` : cfg.fromAddress;
  await client.sendEmail({
    From: from,
    To: options.to,
    Subject: options.subject,
    HtmlBody: options.html,
    TextBody: options.text,
    MessageStream: 'outbound',
  });
}

async function sendViaSmtp(
  cfg: EmailProviderConfig,
  options: SendEmailOptions,
): Promise<void> {
  if (!cfg.smtpHost || !cfg.smtpUser || !cfg.smtpPass) {
    throw new Error('Custom SMTP: host, user, and pass are required.');
  }
  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort ?? 587,
    secure: cfg.smtpSecure ?? false,
    auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
  });
  const from = cfg.fromName ? `"${cfg.fromName}" <${cfg.fromAddress}>` : cfg.fromAddress;
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main send function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends an email via the configured provider.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = await loadEmailProviderConfig();
  if (!cfg) {
    logger.warn('Email send attempted but no provider is configured.');
    return { ok: false, error: 'Email service is not configured.' };
  }

  try {
    switch (cfg.provider) {
      case 'brevo':    await sendViaBrevo(cfg, options); break;
      case 'resend':   await sendViaResend(cfg, options); break;
      case 'mailgun':  await sendViaMailgun(cfg, options); break;
      case 'sendgrid': await sendViaSendGrid(cfg, options); break;
      case 'postmark': await sendViaPostmark(cfg, options); break;
      case 'smtp':     await sendViaSmtp(cfg, options); break;
      default:
        return { ok: false, error: 'Email service is not configured.' };
    }
    logger.info('Email sent.', { provider: cfg.provider, to: options.to, subject: options.subject });
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Failed to send email.', { provider: cfg.provider, error: msg, to: options.to });
    return { ok: false, error: 'Failed to send email. Please try again later.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email templates (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  appName = 'Elahe Messenger',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subject = `Your verification code for ${appName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f11;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px 32px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 8px;">Email Verification</h1>
      <p style="color:#a1a1aa;font-size:14px;margin:0;">${appName}</p>
    </div>
    <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Use the following code to verify your email address. This code expires in <strong style="color:#fafafa;">10 minutes</strong>.
    </p>
    <div style="background:#09090b;border:1px solid #3f3f46;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#f59e0b;font-variant-numeric:tabular-nums;">${code}</span>
    </div>
    <p style="color:#71717a;font-size:13px;margin:0;text-align:center;">If you did not request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`.trim();

  const text = `Your ${appName} verification code: ${code}\n\nExpires in 10 minutes.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
  appName = 'Elahe Messenger',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subject = `Password reset code for ${appName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f11;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px 32px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 8px;">Password Reset</h1>
      <p style="color:#a1a1aa;font-size:14px;margin:0;">${appName}</p>
    </div>
    <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Use the following code to reset your password. This code expires in <strong style="color:#fafafa;">10 minutes</strong>.
    </p>
    <div style="background:#09090b;border:1px solid #3f3f46;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#3b82f6;font-variant-numeric:tabular-nums;">${code}</span>
    </div>
    <p style="color:#71717a;font-size:13px;margin:0;text-align:center;">If you did not request a password reset, ignore this email.</p>
  </div>
</body>
</html>`.trim();

  const text = `Your ${appName} password reset code: ${code}\n\nExpires in 10 minutes.`;
  return sendEmail({ to, subject, html, text });
}
