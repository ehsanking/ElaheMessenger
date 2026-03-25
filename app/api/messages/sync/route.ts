import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { syncConversation, markMessagesDelivered } from '@/lib/messaging-service';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const recipientId = req.nextUrl.searchParams.get('recipientId') || undefined;
  const groupId = req.nextUrl.searchParams.get('groupId') || undefined;
  const since = req.nextUrl.searchParams.get('since') || undefined;
  const limit = Number(req.nextUrl.searchParams.get('limit') || '200');
  const result = await syncConversation(session.userId, { recipientId, groupId, since, limit });
  return NextResponse.json(result, { status: 'error' in result ? 403 : 200 });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const messageIds = Array.isArray(body?.messageIds) ? body.messageIds.filter((value: unknown): value is string => typeof value === 'string') : [];
  const result = await markMessagesDelivered(session.userId, messageIds);
  return NextResponse.json(result);
}
