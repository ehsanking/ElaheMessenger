// Next.js Instrumentation — runs once on server startup.
// This file is loaded by the Next.js standalone server automatically.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run admin initialization on the server (not during build or on edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeAdmin } = await import('./lib/auth-utils');
    await initializeAdmin();
  }
}
