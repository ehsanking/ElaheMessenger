export class HttpAuthError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = 'HttpAuthError';
    this.status = status;
  }
}

const isSameOriginRequest = (url: string): boolean => {
  if (url.startsWith('/')) return true;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return true;
  if (typeof window === 'undefined') return false;

  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
};

const toHeaders = (headers?: HeadersInit): Headers => {
  if (headers instanceof Headers) return new Headers(headers);
  return new Headers(headers);
};

export async function fetchWithCsrf<T = unknown>(
  url: string,
  init: RequestInit = {},
  csrfToken?: string | null,
): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = toHeaders(init.headers);

  if (method !== 'GET' && csrfToken && !headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', csrfToken);
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: init.credentials ?? (isSameOriginRequest(url) ? 'include' : init.credentials),
  };

  const response = await fetch(url, requestInit);

  if (response.status === 401 || response.status === 403) {
    let message = response.status === 401
      ? 'Authentication required.'
      : 'Forbidden request.';

    try {
      const payload = await response.json() as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // use default message
    }

    throw new HttpAuthError(response.status, message);
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return await response.json() as T;
}
