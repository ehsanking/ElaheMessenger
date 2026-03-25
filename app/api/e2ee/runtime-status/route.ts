import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { E2EE_POLICY } from '@/lib/e2ee-policy';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);

  return NextResponse.json({
    success: true,
    authenticated: Boolean(session),
    phase3: {
      registrationBundleV2: true,
      liveDecryptPayload: true,
      secureUploadRoute: true,
      secureDownloadRoute: true,
      legacyAttachmentBridge: true,
      requiresSchemaPatch: true,
      requiresRuntimeWiring: true,
    },
    policy: E2EE_POLICY,
  });
}
