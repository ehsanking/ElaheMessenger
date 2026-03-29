import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCsrf } from '@/lib/http/fetchWithCsrf';

describe('fetchWithCsrf', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds csrf header on POST and DELETE but not on GET', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCsrf('/api/drafts', { method: 'POST' }, 'token-1');
    await fetchWithCsrf('/api/drafts', { method: 'DELETE' }, 'token-1');
    await fetchWithCsrf('/api/drafts', { method: 'GET' }, 'token-1');

    const postInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const deleteInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const getInit = fetchMock.mock.calls[2]?.[1] as RequestInit;

    expect(new Headers(postInit.headers).get('x-csrf-token')).toBe('token-1');
    expect(new Headers(deleteInit.headers).get('x-csrf-token')).toBe('token-1');
    expect(new Headers(getInit.headers).get('x-csrf-token')).toBeNull();
  });

  it('preserves existing headers and does not overwrite caller csrf token', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCsrf('/api/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'caller-token',
        'x-extra-header': 'keep-me',
      },
    }, 'session-token');

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);

    expect(headers.get('x-csrf-token')).toBe('caller-token');
    expect(headers.get('x-extra-header')).toBe('keep-me');
    expect(headers.get('content-type')).toBe('application/json');
  });
});
