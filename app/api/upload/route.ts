import { NextRequest, NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  await appendAuditLog({
    action: 'LEGACY_PUBLIC_UPLOAD_BLOCKED',
    actorUserId: session?.userId ?? null,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip'),
    outcome: 'blocked',
    details: { reason: 'legacy_public_upload_disabled' },
  });

  return NextResponse.json(
    { error: 'Public upload endpoint has been retired for security reasons. Use secure attachment upload.' },
    { status: 410 },
  );
}
