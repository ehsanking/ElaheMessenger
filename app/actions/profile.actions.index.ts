'use server';

/**
 * @deprecated Legacy profile index.
 * Migration guide:
 * - Import from `profile.actions.ts`.
 */

import {
  getPublicUserProfile as origGetPublicUserProfile,
  getUserProfile as origGetUserProfile,
  updateUserProfile as origUpdateUserProfile,
} from './profile.actions';

export async function getUserProfile(...args: Parameters<typeof origGetUserProfile>) {
  return origGetUserProfile(...args);
}

export async function getPublicUserProfile(...args: Parameters<typeof origGetPublicUserProfile>) {
  return origGetPublicUserProfile(...args);
}

export async function updateUserProfile(...args: Parameters<typeof origUpdateUserProfile>) {
  return origUpdateUserProfile(...args);
}
