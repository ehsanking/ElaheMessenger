"use server";

// This module exposes user profile server actions.  It re-exports the
// implementations from the central auth module, allowing other parts of the
// application to depend on smaller, more focused files instead of the
// monolithic app/actions/auth.ts.  Use this module when fetching or
// updating a user's profile or retrieving public settings.

export { getUserProfile, updateUserProfile, getPublicSettings } from './auth';
