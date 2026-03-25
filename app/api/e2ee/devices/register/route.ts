import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verifySignedPreKey } from '@/lib/e2ee-signing';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json();
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : '';
    const label = typeof body?.label === 'string' ? body.label.trim() : '';
    const identityKeyPublic = typeof body?.identityKeyPublic === 'string' ? body.identityKeyPublic.trim() : '';
    const signingPublicKey = typeof body?.signingPublicKey === 'string' ? body.signingPublicKey.trim() : '';
    const signedPreKey = typeof body?.signedPreKey === 'string' ? body.signedPreKey.trim() : '';
    const signedPreKeySig = typeof body?.signedPreKeySig === 'string' ? body.signedPreKeySig.trim() : '';
    const ratchetPublicKey = typeof body?.ratchetPublicKey === 'string' ? body.ratchetPublicKey.trim() : '';
    const isPrimary = body?.isPrimary === true;
    const oneTimePreKeys = Array.isArray(body?.oneTimePreKeys) ? body.oneTimePreKeys : [];

    if (!deviceId || !identityKeyPublic || !signingPublicKey || !signedPreKey || !signedPreKeySig) {
      return NextResponse.json({ error: 'Missing required device bundle fields.' }, { status: 400 });
    }

    const signatureValid = await verifySignedPreKey(signedPreKey, signedPreKeySig, signingPublicKey);
    if (!signatureValid) return NextResponse.json({ error: 'Invalid signed pre-key signature.' }, { status: 400 });

    const device = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.userDevice.updateMany({ where: { userId: session.userId }, data: { isPrimary: false } });
      }
      const savedDevice = await tx.userDevice.upsert({
        where: { userId_deviceId: { userId: session.userId, deviceId } },
        update: {
          label: label || null,
          identityKeyPublic,
          signingPublicKey,
          signedPreKey,
          signedPreKeySig,
          ratchetPublicKey: ratchetPublicKey || null,
          isPrimary,
          isRevoked: false,
          lastPreKeyRotationAt: new Date(),
          lastSeenAt: new Date(),
        },
        create: {
          userId: session.userId,
          deviceId,
          label: label || null,
          identityKeyPublic,
          signingPublicKey,
          signedPreKey,
          signedPreKeySig,
          ratchetPublicKey: ratchetPublicKey || null,
          isPrimary,
          lastPreKeyRotationAt: new Date(),
          lastSeenAt: new Date(),
        },
      });
      await tx.oneTimePreKey.deleteMany({ where: { deviceId: savedDevice.id, status: { in: ['AVAILABLE', 'RESERVED'] } } });
      if (oneTimePreKeys.length > 0) {
        await tx.oneTimePreKey.createMany({
          data: oneTimePreKeys
            .filter((item: any) => typeof item?.keyId === 'string' && typeof item?.publicKey === 'string')
            .map((item: any) => ({
              userId: session.userId,
              deviceId: savedDevice.id,
              keyId: item.keyId.trim(),
              publicKey: item.publicKey.trim(),
              signature: typeof item?.signature === 'string' ? item.signature.trim() : null,
              expiresAt: typeof item?.expiresAt === 'string' ? new Date(item.expiresAt) : null,
            })),
          skipDuplicates: true,
        });
      }
      await tx.e2EEKeyEvent.create({
        data: {
          userId: session.userId,
          deviceId: savedDevice.id,
          eventType: 'DEVICE_REGISTERED',
          keyRef: signedPreKey,
          details: JSON.stringify({ label: label || null, oneTimePreKeyCount: oneTimePreKeys.length, isPrimary }),
        },
      });
      return savedDevice;
    });

    return NextResponse.json({ success: true, deviceId: device.deviceId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to register device.' }, { status: 500 });
  }
}
