'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-gray-300">
        An unexpected error occurred. Try again, and if the issue persists contact your administrator.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  );
}
