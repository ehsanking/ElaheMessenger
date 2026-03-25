"use server";

// This module exposes group and community management server actions.  It
// re-exports implementations from the central auth module, allowing other
// parts of the application to depend on smaller, more focused files instead
// of the monolithic app/actions/auth.ts.  Use this module for reading and
// modifying group memberships and properties.

export {
  getUserCommunities,
  createCommunity,
  joinGroupByInvite,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupMembers,
  leaveGroup,
} from './auth';
