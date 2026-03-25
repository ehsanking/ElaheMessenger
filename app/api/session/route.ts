import { NextResponse } from 'next/server';
import { clearSession, getSessionFromRequest } from '@/lib/session';
import { assertSameOrigin, validateCsrfToken } from '@/lib/request-security';


export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      username: session.username,
      numericId: session.numericId,
      role: session.role,
      badge: session.badge,
      isVerified: session.isVerified,
      needsPasswordChange: session.needsPasswordChange,
    },
    csrfToken: session.csrfToken,
  });
}

export async function DELETE(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
    validateCsrfToken(request, session);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid logout request.' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  clearSession(response);
  return response;
}
