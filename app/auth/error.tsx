'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error boundary for the /auth route segment.
 *
 * Provides a recovery UI for authentication-related errors, directing
 * the user back to the login page or to retry the current operation.
 */
export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Auth error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold">Authentication Error</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        Something went wrong during authentication. Please try again or return to the login page.
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--text-muted)] font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[var(--color-brand-blue,#0f365b)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/auth/login"
          className="rounded-full border border-[var(--border-color)] px-5 py-2 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
