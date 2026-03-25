import { NextResponse } from 'next/server';
import { getRuntimePreKeyBundle } from '@/lib/e2ee-runtime-service';

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('deviceId');
    const bundle = await getRuntimePreKeyBundle(userId, deviceId);
    return NextResponse.json({ success: true, bundle });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch prekey bundle.' }, { status: 500 });
  }
}
