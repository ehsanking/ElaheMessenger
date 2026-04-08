'use server';

/**
 * Canonical group/community actions.
 *
 * Migration guide:
 * - Prefer importing from `@/app/actions/groups.actions`.
 * - Legacy shims: `community.actions.ts`, `community-actions.ts`, `auth.groups.ts`.
 */

import {
  addMemberToGroup as origAddMemberToGroup,
  createCommunity as origCreateCommunity,
  getGroupMembers as origGetGroupMembers,
  getMessageHistory as origGetMessageHistory,
  getUserCommunities as origGetUserCommunities,
  joinGroupByInvite as origJoinGroupByInvite,
  leaveGroup as origLeaveGroup,
  removeMemberFromGroup as origRemoveMemberFromGroup,
} from './community.actions';

export async function getUserCommunities(...args: Parameters<typeof origGetUserCommunities>) {
  return origGetUserCommunities(...args);
}

export async function createCommunity(...args: Parameters<typeof origCreateCommunity>) {
  return origCreateCommunity(...args);
}

export async function joinGroupByInvite(...args: Parameters<typeof origJoinGroupByInvite>) {
  return origJoinGroupByInvite(...args);
}

export async function addMemberToGroup(...args: Parameters<typeof origAddMemberToGroup>) {
  return origAddMemberToGroup(...args);
}

export async function removeMemberFromGroup(...args: Parameters<typeof origRemoveMemberFromGroup>) {
  return origRemoveMemberFromGroup(...args);
}

export async function getGroupMembers(...args: Parameters<typeof origGetGroupMembers>) {
  return origGetGroupMembers(...args);
}

export async function leaveGroup(...args: Parameters<typeof origLeaveGroup>) {
  return origLeaveGroup(...args);
}

export async function getMessageHistory(...args: Parameters<typeof origGetMessageHistory>) {
  return origGetMessageHistory(...args);
}
