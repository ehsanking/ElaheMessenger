import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
    if (!normalizedUserId) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true,
        identityKeyPublic: true,
        signedPreKey: true,
        signedPreKeySig: true,
        signingPublicKey: true,
        e2eeVersion: true,
        devices: {
          where: { isRevoked: false },
          orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
          select: { deviceId: true, label: true, isPrimary: true, ratchetPublicKey: true, lastPreKeyRotationAt: true, _count: { select: { oneTimePreKeys: true } } },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({
      success: true,
      keys: {
        userId: user.id,
        agreementPublicKey: user.identityKeyPublic,
        signingPublicKey: user.signingPublicKey ?? null,
        signedPreKey: user.signedPreKey,
        signedPreKeySig: user.signedPreKeySig,
        e2eeVersion: user.devices.length ? 'phase4' : (user.e2eeVersion ?? 'v2'),
        devices: user.devices.map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
          isPrimary: device.isPrimary,
          ratchetPublicKey: device.ratchetPublicKey,
          lastPreKeyRotationAt: device.lastPreKeyRotationAt,
          availablePreKeys: device._count.oneTimePreKeys,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch E2EE public keys.' }, { status: 500 });
  }
}
