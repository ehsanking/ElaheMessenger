import { describe, expect, it, vi } from 'vitest';
import { logoutWithCsrf } from '@/hooks/useSession';

describe('useSession logout helper', () => {
  it('sends DELETE /api/session with x-csrf-token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await logoutWithCsrf('csrf-token-123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(url).toBe('/api/session');
    expect(init.method).toBe('DELETE');
    expect(init.credentials).toBe('include');
    expect(headers.get('x-csrf-token')).toBe('csrf-token-123');
  });
});
