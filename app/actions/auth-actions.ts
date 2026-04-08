'use server';

/**
 * @deprecated Legacy auth barrel.
 * Migration guide:
 * - New imports should use `auth.actions.ts`, `auth.2fa.actions.ts`, and `auth.recovery.actions.ts`.
 * - This file remains as a compatibility shim.
 */

import {
  getPublicSettings as origGetPublicSettings,
  loginUser as origLoginUser,
  registerUser as origRegisterUser,
} from './auth.actions';
import {
  getRecoveryQuestion as origGetRecoveryQuestion,
  recoverPassword as origRecoverPassword,
} from './auth.recovery.actions';
import { validate2FALogin as origValidate2FALogin } from './auth.2fa.actions';

export async function registerUser(...args: Parameters<typeof origRegisterUser>) {
  return origRegisterUser(...args);
}

export async function loginUser(...args: Parameters<typeof origLoginUser>) {
  return origLoginUser(...args);
}

export async function getPublicSettings(...args: Parameters<typeof origGetPublicSettings>) {
  return origGetPublicSettings(...args);
}

export async function getRecoveryQuestion(...args: Parameters<typeof origGetRecoveryQuestion>) {
  return origGetRecoveryQuestion(...args);
}

export async function recoverPassword(...args: Parameters<typeof origRecoverPassword>) {
  return origRecoverPassword(...args);
}

export async function validate2FALogin(...args: Parameters<typeof origValidate2FALogin>) {
  return origValidate2FALogin(...args);
}
