import { prisma } from '@/lib/prisma';

export type ConversationAccessResult =
  | { allowed: true; kind: 'group'; groupId: string; membershipRole: string; isMuted: boolean }
  | { allowed: true; kind: 'direct'; peerUserId: string }
  | { allowed: false; reason: string; kind?: 'group' | 'direct' | 'unknown' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeDmPair = (value: string) => value.split(':').map((part) => part.trim()).filter(Boolean);

export async function authorizeConversationAccess(
  conversationId: string,
  userId: string,
): Promise<ConversationAccessResult> {
  const normalized = conversationId.trim();
  if (!normalized) return { allowed: false, reason: 'missing_conversation_id', kind: 'unknown' };

  const group = await prisma.group.findUnique({ where: { id: normalized }, select: { id: true } }).catch(() => null);
  if (group) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: normalized, userId } },
      select: { role: true, isMuted: true },
    }).catch(() => null);

    if (!membership) {
      return { allowed: false, reason: 'missing_group_membership', kind: 'group' };
    }

    return {
      allowed: true,
      kind: 'group',
      groupId: normalized,
      membershipRole: membership.role,
      isMuted: membership.isMuted,
    };
  }

  if (normalized.startsWith('dm:')) {
    const [, ...parts] = normalized.split(':');
    const pair = parts.map((part) => part.trim()).filter(Boolean);
    if (pair.length !== 2 || !pair.includes(userId)) {
      return { allowed: false, reason: 'invalid_direct_conversation', kind: 'direct' };
    }
    const peerUserId = pair.find((part) => part !== userId) ?? userId;
    const peer = await prisma.user.findUnique({ where: { id: peerUserId }, select: { id: true, isBanned: true } }).catch(() => null);
    if (!peer || peer.isBanned) {
      return { allowed: false, reason: 'invalid_direct_peer', kind: 'direct' };
    }
    return { allowed: true, kind: 'direct', peerUserId };
  }

  if (UUID_RE.test(normalized)) {
    const peer = await prisma.user.findUnique({ where: { id: normalized }, select: { id: true, isBanned: true } }).catch(() => null);
    if (!peer || peer.isBanned) {
      return { allowed: false, reason: 'invalid_direct_peer', kind: 'direct' };
    }
    return { allowed: true, kind: 'direct', peerUserId: normalized };
  }

  const parts = normalizeDmPair(normalized);
  if (parts.length === 2 && parts.includes(userId)) {
    const peerUserId = parts.find((part) => part !== userId) ?? userId;
    const peer = await prisma.user.findUnique({ where: { id: peerUserId }, select: { id: true, isBanned: true } }).catch(() => null);
    if (!peer || peer.isBanned) {
      return { allowed: false, reason: 'invalid_direct_peer', kind: 'direct' };
    }
    return { allowed: true, kind: 'direct', peerUserId };
  }

  return { allowed: false, reason: 'conversation_not_found', kind: 'unknown' };
}

export async function canSendToGroup(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true, isMuted: true },
  }).catch(() => null);

  if (!membership) {
    return { allowed: false as const, reason: 'missing_group_membership' };
  }

  if (membership.isMuted) {
    return { allowed: false as const, reason: 'member_muted' };
  }

  return { allowed: true as const, role: membership.role };
}
