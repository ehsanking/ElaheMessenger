import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { searchMessages } from '@/lib/messaging-service';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const query = req.nextUrl.searchParams.get('q') || '';
  const recipientId = req.nextUrl.searchParams.get('recipientId') || undefined;
  const groupId = req.nextUrl.searchParams.get('groupId') || undefined;
  const limit = Number(req.nextUrl.searchParams.get('limit') || '25');
  const result = await searchMessages(session.userId, { query, recipientId, groupId, limit });
  return NextResponse.json(result, { status: 'error' in result ? 403 : 200 });
}
