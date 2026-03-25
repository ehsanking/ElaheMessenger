import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { listUserDevices } from '@/lib/e2ee-runtime-service';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const devices = await listUserDevices(session.userId);
    return NextResponse.json({
      success: true,
      devices: devices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label,
        isPrimary: device.isPrimary,
        lastSeenAt: device.lastSeenAt,
        lastPreKeyRotationAt: device.lastPreKeyRotationAt,
        availablePreKeys: device._count.oneTimePreKeys,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to list devices.' }, { status: 500 });
  }
}
