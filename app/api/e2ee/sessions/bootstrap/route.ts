import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { bootstrapDeviceSession } from '@/lib/e2ee-runtime-service';
import { getRequestIdForRequest, respondWithInternalError, respondWithSafeError } from '@/lib/http-errors';

export async function POST(request: Request) {
  const requestId = getRequestIdForRequest(request);
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return respondWithSafeError({ status: 401, message: 'Authentication required.', code: 'AUTH_REQUIRED', requestId });
    }

    const body = await request.json();
    const initiatorDeviceId = typeof body?.initiatorDeviceId === 'string' ? body.initiatorDeviceId.trim() : '';
    const recipientUserId = typeof body?.recipientUserId === 'string' ? body.recipientUserId.trim() : '';
    const recipientDeviceId = typeof body?.recipientDeviceId === 'string' ? body.recipientDeviceId.trim() : null;
    const initialMessageKeyId = typeof body?.initialMessageKeyId === 'string' ? body.initialMessageKeyId.trim() : '';
    const ratchetPublicKey = typeof body?.ratchetPublicKey === 'string' ? body.ratchetPublicKey.trim() : null;

    if (!initiatorDeviceId || !recipientUserId || !initialMessageKeyId) {
      return respondWithSafeError({
        status: 400,
        message: 'Missing bootstrap fields.',
        code: 'VALIDATION_ERROR',
        action: 'Provide initiatorDeviceId, recipientUserId, and initialMessageKeyId.',
        requestId,
      });
    }

    const result = await bootstrapDeviceSession({
      initiatorUserId: session.userId,
      initiatorDeviceId,
      recipientUserId,
      recipientDeviceId,
      initialMessageKeyId,
      ratchetPublicKey,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return respondWithInternalError('E2EE session bootstrap', error, { requestId });
  }
}
