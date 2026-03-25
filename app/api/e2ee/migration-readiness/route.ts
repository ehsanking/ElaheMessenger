import { NextResponse } from 'next/server';

export async function GET() {
  // Phase 3 schema has been fully migrated.  No additional patching is required and all
  // runtime bridges have been removed.  Clients can rely on v2 E2EE throughout the app.
  return NextResponse.json({
    success: true,
    schemaPatch: {
      required: false,
      recommendedUserFields: ['signingPublicKey', 'e2eeVersion'],
      recommendedMessageFields: ['wrappedFileKey', 'wrappedFileKeyNonce', 'fileNonce'],
    },
    runtimeWiring: {
      serverEnvelopeHelper: false,
      registerBundleBridge: false,
      secureAttachmentUpload: true,
      secureAttachmentDownload: true,
      legacyAttachmentBridge: false,
      chatPageWiringPending: false,
      registerPageWiringPending: false,
      serverTsWiringPending: false,
    },
  });
}
