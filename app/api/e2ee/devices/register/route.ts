import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verifySignedPreKey } from '@/lib/e2ee-signing';
import { getRequestIdForRequest, respondWithInternalError, respondWithSafeError } from '@/lib/http-errors';

export async function POST(request: Request) {
  const requestId = getRequestIdForRequest(request);
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return respondWithSafeError({ status: 401, message: 'Authentication required.', code: 'AUTH_REQUIRED', requestId });
    }

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
      return respondWithSafeError({
        status: 400,
        message: 'Missing required device bundle fields.',
        code: 'VALIDATION_ERROR',
        action: 'Provide deviceId, identityKeyPublic, signingPublicKey, signedPreKey, and signedPreKeySig.',
        requestId,
      });
    }

    const signatureValid = await verifySignedPreKey(signedPreKey, signedPreKeySig, signingPublicKey);
    if (!signatureValid) {
      return respondWithSafeError({
        status: 400,
        message: 'Invalid signed pre-key signature.',
        code: 'VALIDATION_ERROR',
        requestId,
      });
    }

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
        // Note: skipDuplicates is not supported by SQLite. Since we already
        // deleted existing keys above (deleteMany), duplicates should not occur.
        await tx.oneTimePreKey.createMany({
          data: oneTimePreKeys
            .filter((item: unknown) => typeof (item as Record<string, unknown>)?.keyId === 'string' && typeof (item as Record<string, unknown>)?.publicKey === 'string')
            .map((item: unknown) => {
              const k = item as Record<string, string | null | undefined>;
              return {
                userId: session.userId,
                deviceId: savedDevice.id,
                keyId: String(k.keyId).trim(),
                publicKey: String(k.publicKey).trim(),
                signature: typeof k.signature === 'string' ? k.signature.trim() : null,
                expiresAt: typeof k.expiresAt === 'string' ? new Date(k.expiresAt) : null,
              };
            }),
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
    return respondWithInternalError('E2EE device registration', error, { requestId });
  }
}
