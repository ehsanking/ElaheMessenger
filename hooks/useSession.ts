'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChatUser } from '@/lib/types';
import { fetchWithCsrf } from '@/lib/http/fetchWithCsrf';

type SessionPayload = {
  authenticated?: boolean;
  user?: ChatUser | null;
  csrfToken?: string;
};

export async function logoutWithCsrf(csrfToken?: string | null): Promise<void> {
  await fetchWithCsrf('/api/session', { method: 'DELETE' }, csrfToken);
}

export function useSession() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/session', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        setUser(null);
        setCsrfToken(null);
        return;
      }

      const data = await res.json() as SessionPayload;
      if (!data.authenticated || !data.user) {
        setUser(null);
        setCsrfToken(null);
        return;
      }

      setUser(data.user);
      setCsrfToken(typeof data.csrfToken === 'string' ? data.csrfToken : null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutWithCsrf(csrfToken);
    setUser(null);
    setCsrfToken(null);
  }, [csrfToken]);

  return {
    user,
    csrfToken,
    isLoading,
    refresh,
    logout,
  };
}
