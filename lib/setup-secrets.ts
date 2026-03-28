/**
 * Automatic secrets generator — runs on first startup.
 *
 * Checks for required env vars. Any that are missing are generated
 * automatically, written to the active env file (.env.local for local dev, .env for docker/production), and printed
 * to the terminal so the operator can note them down.
 *
 * On every subsequent restart the values are already present in
 * that env file and this function is effectively a no-op.
 *
 * IMPORTANT: ADMIN_PASSWORD is only generated on the very first run.
 * Once the admin changes their password via the admin panel, the
 * original generated password in the active env file is kept for reference
 * but is no longer used — the hashed password in the database is
 * the authoritative source. Re-running setupSecrets (e.g. after an
 * update) will NOT overwrite an existing ADMIN_PASSWORD in that env file.
 */

import crypto from 'crypto';
import fs from 'fs';
import { EnvPolicy, loadEnvWithPolicy } from './env-loader';

const REQUIRED_SECRETS: Record<string, () => string> = {
  JWT_SECRET: () => crypto.randomBytes(48).toString('hex'),
  ENCRYPTION_KEY: () => crypto.randomBytes(16).toString('hex'), // 32 hex chars
  ADMIN_PASSWORD: () => crypto.randomBytes(14).toString('base64url'),
};

function generateVapidKeys(): { publicKey: string; privateKey: string } {
  // Use web-push library if available, otherwise fall back to a raw ECDH key pair.
  try {
    // require() is used intentionally here for optional runtime detection of web-push.
    // The no-require-imports rule is already disabled globally in eslint.config.mjs.
    const webpush = require('web-push') as { generateVAPIDKeys: () => { publicKey: string; privateKey: string } };
    return webpush.generateVAPIDKeys();
  } catch {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    return {
      publicKey: (publicKey as unknown as Buffer).toString('base64url'),
      privateKey: (privateKey as unknown as Buffer).toString('base64url'),
    };
  }
}

function appendToEnvFile(envPath: string, entries: Record<string, string>) {
  const lines = Object.entries(entries).map(([k, v]) => `${k}="${v}"`).join('\n');
  const header = fs.existsSync(envPath) ? '\n' : '# Auto-generated secrets — do NOT commit this file\n';
  fs.appendFileSync(envPath, header + lines + '\n', 'utf8');
}

function printSecretsBox(generated: Record<string, string>, adminUser: string, envFileLabel: string) {
  const line = '='.repeat(60);
  const keys = Object.keys(generated).sort().join(', ');
  console.log(`\n${line}`);
  console.log('Elahe Messenger — Security keys generated');
  console.log(line);
  console.log(`Admin username: ${adminUser}`);
  console.log(`Generated keys stored in ${envFileLabel}: ${keys}`);
  console.log('Secret values are intentionally not echoed to stdout.');
  console.log('Rotate the initial admin password after first login.');
  console.log(`${line}\n`);
}

function printExistingPasswordReminder(adminUser: string, envFileLabel: string) {
  const line = '='.repeat(60);
  console.log(`\n${line}`);
  console.log('Elahe Messenger — Admin credentials reminder');
  console.log(line);
  console.log(`Admin username: ${adminUser}`);
  console.log('Admin password value is intentionally not printed.');
  console.log(`Use the current credential already stored in your secret manager or ${envFileLabel}.`);
  console.log(`${line}\n`);
}


function resolveEnvPolicy(): EnvPolicy {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  return appEnv === 'production' ? 'docker-compose' : 'local-dev';
}

export function setupSecrets(): void {
  const envState = loadEnvWithPolicy(process.cwd(), resolveEnvPolicy());
  const existing = envState.values;
  const envFileLabel = envState.primaryPath.endsWith('.env') ? '.env' : '.env.local';
  const generated: Record<string, string> = {};

  // Check simple scalar secrets
  for (const [key, generator] of Object.entries(REQUIRED_SECRETS)) {
    // If already in process.env (from shell/env-file loading), skip
    if (process.env[key] || existing[key]) {
      // Make sure env is set from loaded env files if not already present
      if (!process.env[key] && existing[key]) {
        process.env[key] = existing[key];
      }
      continue;
    }
    const value = generator();
    generated[key] = value;
    process.env[key] = value;
  }

  // Check VAPID keys (must be generated together)
  const hasVapidPublic = process.env.VAPID_PUBLIC_KEY || existing.VAPID_PUBLIC_KEY;
  const hasVapidPrivate = process.env.VAPID_PRIVATE_KEY || existing.VAPID_PRIVATE_KEY;
  if (!hasVapidPublic || !hasVapidPrivate) {
    const { publicKey, privateKey } = generateVapidKeys();
    generated.VAPID_PUBLIC_KEY = publicKey;
    generated.VAPID_PRIVATE_KEY = privateKey;
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
  }

  if (!process.env.VAPID_EMAIL && !existing.VAPID_EMAIL) {
    const email = 'mailto:admin@localhost';
    generated.VAPID_EMAIL = email;
    process.env.VAPID_EMAIL = email;
  }

  // If DATABASE_URL is not set anywhere, default to SQLite in development
  const hasDatabaseUrl = process.env.DATABASE_URL || existing.DATABASE_URL;
  if (!hasDatabaseUrl && process.env.NODE_ENV !== 'production') {
    const sqliteFallback = 'file:./prisma/dev.db';
    generated.DATABASE_URL = sqliteFallback;
    process.env.DATABASE_URL = sqliteFallback;
  }

  // Apply any loaded env-file values that are not already in the environment
  for (const [key, value] of Object.entries(existing)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  if (Object.keys(generated).length > 0) {
    appendToEnvFile(envState.primaryPath, generated);
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    printSecretsBox(generated, adminUser, envFileLabel);
  } else {
    // No new secrets generated — show existing admin password as reminder
    const adminPassword = existing.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      printExistingPasswordReminder(adminUser, envFileLabel);
    }
  }
}
