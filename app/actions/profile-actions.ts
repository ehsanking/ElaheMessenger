'use server';

/**
 * @deprecated Legacy profile barrel.
 * Migration guide:
 * - Import profile operations from `profile.actions.ts`.
 * - Import key lookup from `keys.actions.ts`.
 */

import {
  getPublicUserProfile as origGetPublicUserProfile,
  getSelfUserProfile as origGetSelfUserProfile,
  updateUserProfile as origUpdateUserProfile,
} from './profile.actions';
import { getUserPublicKeys as origGetUserPublicKeys } from './keys.actions';

export async function getPublicUserProfile(...args: Parameters<typeof origGetPublicUserProfile>) {
  return origGetPublicUserProfile(...args);
}

export async function getSelfUserProfile(...args: Parameters<typeof origGetSelfUserProfile>) {
  return origGetSelfUserProfile(...args);
}

export async function updateUserProfile(...args: Parameters<typeof origUpdateUserProfile>) {
  return origUpdateUserProfile(...args);
}

export async function getUserPublicKeys(...args: Parameters<typeof origGetUserPublicKeys>) {
  return origGetUserPublicKeys(...args);
}
