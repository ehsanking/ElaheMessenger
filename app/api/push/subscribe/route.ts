import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRateLimitHeaders, rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getSessionFromRequest } from '@/lib/session';

const getClientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let rateHeaders: HeadersInit | undefined;

  try {
    const body = await request.json();
    const subscription = body?.subscription;

    // Derive the userId from the authenticated session rather than trusting
    // client‑supplied user identifiers.  If the session is missing the
    // request is unauthorized.
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const userId = session.userId;

    // Rate limit by IP and userId to mitigate abuse.  Anonymous requests are
    // disallowed entirely.
    const rateResult = await rateLimit(`push-subscribe:${ip}:${userId}`);
    rateHeaders = getRateLimitHeaders(rateResult);

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many subscription requests. Please try again later.' },
        { status: 429, headers: rateHeaders },
      );
    }

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400, headers: rateHeaders });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true }, { headers: rateHeaders });
  } catch (error) {
    logger.error('Push subscription error.', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500, headers: rateHeaders });
  }
}
