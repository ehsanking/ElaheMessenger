import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Legacy Pages Router endpoint intentionally disabled.
 *
 * Security note:
 * secure attachment uploads are only supported through the App Router
 * endpoint at `app/api/upload-secure/route.ts`, which enforces fresh session,
 * origin checks, authorization, and encrypted metadata handling.
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'This legacy endpoint is disabled. Use /api/upload-secure.',
    code: 'LEGACY_ENDPOINT_DISABLED',
  });
}
