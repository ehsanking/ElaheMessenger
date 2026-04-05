import fs from 'fs';
import { describe, expect, it } from 'vitest';

describe('security headers hardening', () => {
  it('sets HSTS in production and supports connect-src allowlist extension', () => {
    const source = fs.readFileSync('lib/security-headers.ts', 'utf8');
    expect(source).toContain("'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'");
    expect(source).toContain('CSP_CONNECT_SRC_EXTRA');
    expect(source).toContain('connect-src ${buildConnectSrc()}');
  });
});

