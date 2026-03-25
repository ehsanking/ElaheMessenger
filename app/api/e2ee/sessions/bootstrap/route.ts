import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { bootstrapDeviceSession } from '@/lib/e2ee-runtime-service';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json();
    const initiatorDeviceId = typeof body?.initiatorDeviceId === 'string' ? body.initiatorDeviceId.trim() : '';
    const recipientUserId = typeof body?.recipientUserId === 'string' ? body.recipientUserId.trim() : '';
    const recipientDeviceId = typeof body?.recipientDeviceId === 'string' ? body.recipientDeviceId.trim() : null;
    const initialMessageKeyId = typeof body?.initialMessageKeyId === 'string' ? body.initialMessageKeyId.trim() : '';
    const ratchetPublicKey = typeof body?.ratchetPublicKey === 'string' ? body.ratchetPublicKey.trim() : null;

    if (!initiatorDeviceId || !recipientUserId || !initialMessageKeyId) {
      return NextResponse.json({ error: 'Missing bootstrap fields.' }, { status: 400 });
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to bootstrap session.' }, { status: 500 });
  }
}
