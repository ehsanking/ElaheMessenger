const isProduction = process.env.NODE_ENV === 'production';

const buildContentSecurityPolicy = () => {
  const scriptSrc = ["'self'", ...(isProduction ? [] : ["'unsafe-inline'", "'unsafe-eval'"])]
    .filter(Boolean)
    .join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "connect-src 'self' ws: wss: https:",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; ');
};

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Content-Security-Policy': buildContentSecurityPolicy(),
};

export const applySecurityHeaders = (headers: Headers) => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return headers;
};
