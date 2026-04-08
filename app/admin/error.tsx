'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error boundary for the /admin route segment.
 *
 * Provides an admin-specific recovery UI, reminding the administrator
 * to check server logs for details about the underlying failure.
 */
export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Admin panel error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold">Admin Panel Error</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        An error occurred in the admin panel. Check server logs for more details.
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--text-muted)] font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Retry
        </button>
        <a
          href="/chat"
          className="rounded-full border border-[var(--border-color)] px-5 py-2 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
        >
          Back to chat
        </a>
      </div>
    </div>
  );
}
