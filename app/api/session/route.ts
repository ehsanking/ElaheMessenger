import { NextResponse } from 'next/server';
import { clearSession, getSessionFromRequest, shouldRotateSession, rotateSession } from '@/lib/session';
import { assertSameOrigin, validateCsrfToken } from '@/lib/request-security';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Validate sessionVersion against the database to support server-side revocation.
  // If the user's sessionVersion in the DB has been incremented (e.g. password change,
  // admin force-logout), the old session token is effectively invalidated.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      numericId: true,
      role: true,
      badge: true,
      isVerified: true,
      totpEnabled: true,
      needsPasswordChange: true,
      sessionVersion: true,
      isBanned: true,
      isApproved: true,
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Reject banned or unapproved users even if they hold a valid token
  if (user.isBanned || !user.isApproved) {
    const response = NextResponse.json({ authenticated: false, reason: 'account_restricted' }, { status: 401 });
    clearSession(response);
    return response;
  }

  // Reject if session version doesn't match (password changed, force logout, etc.)
  if (user.sessionVersion !== session.sessionVersion) {
    const response = NextResponse.json({ authenticated: false, reason: 'session_revoked' }, { status: 401 });
    clearSession(response);
    return response;
  }

  // Role mismatch (admin promoted/demoted while session was active)
  if (user.role !== session.role) {
    const response = NextResponse.json({ authenticated: false, reason: 'role_changed' }, { status: 401 });
    clearSession(response);
    return response;
  }

  const responsePayload = {
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      numericId: user.numericId,
      role: user.role,
      badge: user.badge,
      isVerified: user.isVerified,
      totpEnabled: user.totpEnabled,
      needsPasswordChange: user.needsPasswordChange,
    },
    csrfToken: session.csrfToken,
  };

  // Automatic session rotation: if the token is older than the rotation
  // interval, issue a fresh token with a new csrfToken and extended expiry.
  // This limits the damage window of a stolen session cookie.
  if (shouldRotateSession(session)) {
    const response = NextResponse.json(responsePayload);
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
    const newSession = rotateSession(response, session, { userAgent, ip });
    // Update the csrfToken in the response to match the new token
    const updatedPayload = { ...responsePayload, csrfToken: newSession.csrfToken };
    return NextResponse.json(updatedPayload, {
      headers: response.headers,
    });
  }

  return NextResponse.json(responsePayload);
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
