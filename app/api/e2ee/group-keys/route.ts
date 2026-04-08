import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFreshAuthenticatedUser } from '@/lib/fresh-session';

export async function POST(request: NextRequest) {
  const session = await requireFreshAuthenticatedUser(request);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    groupId?: string;
    keyGeneration?: number;
    senderPublicKey?: string;
    wrappedKeys?: Array<{ recipientUserId: string; wrappedKey: string; nonce: string }>;
    chainKey?: string;
    deviceId?: string;
  } | null;

  const groupId = body?.groupId?.trim();
  const wrappedKeys = Array.isArray(body?.wrappedKeys) ? body.wrappedKeys : [];
  const senderPublicKey = body?.senderPublicKey?.trim();
  const chainKey = body?.chainKey?.trim();
  const deviceId = body?.deviceId?.trim() || 'default-device';
  const keyGeneration = Number.isInteger(body?.keyGeneration) ? Number(body?.keyGeneration) : 0;

  if (!groupId || !senderPublicKey || !chainKey || wrappedKeys.length === 0) {
    return NextResponse.json({ error: 'Invalid sender key distribution payload.' }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    await tx.groupSenderKey.upsert({
      where: { groupId_userId_deviceId: { groupId, userId: session.id, deviceId } },
      update: { chainKey, publicKey: senderPublicKey, keyGeneration },
      create: { groupId, userId: session.id, deviceId, chainKey, publicKey: senderPublicKey, keyGeneration },
    });

    await tx.groupSenderKeyDistribution.createMany({
      data: wrappedKeys
        .filter((item) => item?.recipientUserId?.trim() && item?.wrappedKey?.trim() && item?.nonce?.trim())
        .map((item) => ({
          groupId,
          senderUserId: session.id,
          recipientUserId: item.recipientUserId.trim(),
          wrappedKey: item.wrappedKey.trim(),
          nonce: item.nonce.trim(),
          keyGeneration,
        })),
    });
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const session = await requireFreshAuthenticatedUser(request);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const pending = await prisma.groupSenderKeyDistribution.findMany({
    where: { recipientUserId: session.id, consumed: false },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  await prisma.groupSenderKeyDistribution.updateMany({
    where: { id: { in: pending.map((item) => item.id) } },
    data: { consumed: true },
  });

  return NextResponse.json({ success: true, distributions: pending });
}
