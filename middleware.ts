import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromCookieHeader } from '@/lib/session';
import { applySecurityHeaders } from '@/lib/security-headers';
import { createRequestId } from '@/lib/observability';

const AUTH_ROUTES = ['/auth/login', '/auth/register'];
const SETUP_ADMIN_ROUTE = '/auth/setup-admin';
const CHAT_ROUTE = '/chat';
const LEGACY_CHAT_ROUTE = '/chat-v2';

export function middleware(request: NextRequest) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'), {
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
  });
  const { pathname } = request.nextUrl;

  if (pathname === LEGACY_CHAT_ROUTE || pathname.startsWith(`${LEGACY_CHAT_ROUTE}/`)) {
    const response = NextResponse.redirect(new URL(CHAT_ROUTE, request.url), 308);
    response.headers.set('x-request-id', request.headers.get('x-request-id') || createRequestId());
    response.headers.set('x-legacy-route-retired', 'chat-v2');
    applySecurityHeaders(response.headers);
    return response;
  }

  // If no session and user is trying to access chat or admin setup, redirect to login
  if (!session && (pathname === CHAT_ROUTE || pathname.startsWith(`${CHAT_ROUTE}/`) || pathname === SETUP_ADMIN_ROUTE)) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    applySecurityHeaders(response.headers);
    return response;
  }

  // If session exists but user needs to change password, enforce setup-admin page
  if (session?.needsPasswordChange && (pathname === CHAT_ROUTE || pathname === SETUP_ADMIN_ROUTE)) {
    const response = NextResponse.redirect(new URL(SETUP_ADMIN_ROUTE, request.url));
    applySecurityHeaders(response.headers);
    return response;
  }

  // If session exists and user visits auth routes, redirect to chat
  if (session && AUTH_ROUTES.includes(pathname) && !session.needsPasswordChange) {
    const response = NextResponse.redirect(new URL(CHAT_ROUTE, request.url));
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', request.headers.get('x-request-id') || createRequestId());
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ['/auth/login', '/auth/register', '/auth/setup-admin', '/chat', '/chat/:path*', '/chat-v2', '/chat-v2/:path*'],
};
