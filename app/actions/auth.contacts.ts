"use server";

// This module exposes contact management server actions.  It re-exports
// implementations from the central auth module, allowing other parts of the
// application to depend on smaller, more focused files instead of the
// monolithic app/actions/auth.ts.  Use this module for adding, removing and
// listing contacts.

export { getContacts, addContact, removeContact } from './auth';
