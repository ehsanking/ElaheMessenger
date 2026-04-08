'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error boundary for the /chat route segment.
 *
 * Provides a contextual recovery UI for chat-related errors, allowing
 * the user to retry, return to the chat list, or log out and back in.
 */
export default function ChatError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Chat error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold">Chat connection issue</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        Something went wrong with your chat session. This could be a network issue or a temporary server error.
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
          Reconnect
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
