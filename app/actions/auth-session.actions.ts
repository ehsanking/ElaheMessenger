/*
 * Session-less authentication actions.
 *
 * This module re‑exports authentication related server actions from the legacy
 * `auth.ts` file that do not require a logged‑in user.  Keeping these
 * functions here allows consumers to import only what they need from a
 * dedicated entrypoint rather than pulling in the entire monolithic auth
 * implementation.  Functions that depend on the caller's session (for
 * example updating a profile or managing contacts) live in their own
 * modules.
 */

'use server';

// Re‑export session‑independent actions from the original auth module.
// These actions perform registration, login and various public lookups.
export {
  generateCaptcha,
  registerUser,
  loginUser,
  searchUsers,
  getPublicSettings,
  getUserPublicKeys,
  validate2FALogin,
} from './auth';