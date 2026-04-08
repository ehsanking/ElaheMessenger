'use server';

/**
 * @deprecated Legacy contacts barrel.
 * Migration guide:
 * - Import contact operations from `contacts.actions.ts`.
 * - Import search from `search.actions.ts`.
 */

import { addContact as origAddContact, getContacts as origGetContacts, removeContact as origRemoveContact } from './contacts.actions';
import { searchUsers as origSearchUsers } from './search.actions';

export async function addContact(...args: Parameters<typeof origAddContact>) {
  return origAddContact(...args);
}

export async function removeContact(...args: Parameters<typeof origRemoveContact>) {
  return origRemoveContact(...args);
}

export async function getContacts(...args: Parameters<typeof origGetContacts>) {
  return origGetContacts(...args);
}

export async function searchUsers(...args: Parameters<typeof origSearchUsers>) {
  return origSearchUsers(...args);
}
