'use server';

/**
 * Canonical password recovery actions.
 *
 * Migration guide:
 * - Prefer importing from `@/app/actions/auth.recovery.actions`.
 * - Legacy shims: `auth-session.actions.ts`, `auth-actions.ts`, `auth.ts`.
 */

import { getRecoveryQuestion as origGetRecoveryQuestion, recoverPassword as origRecoverPassword } from './auth-legacy';

export async function getRecoveryQuestion(...args: Parameters<typeof origGetRecoveryQuestion>) {
  return origGetRecoveryQuestion(...args);
}

export async function recoverPassword(...args: Parameters<typeof origRecoverPassword>) {
  return origRecoverPassword(...args);
}
